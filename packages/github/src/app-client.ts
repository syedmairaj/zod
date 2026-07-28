import { createAppAuth } from "@octokit/auth-app";

const GITHUB_API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

export interface GithubInstallationInfo {
  installationId: number;
  accountLogin: string;
  accountId: number;
  accountType: string;
}

export interface GithubInstallationRepoSummary {
  providerRepositoryId: number;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
}

/**
 * Provider-facing interface for GitHub App operations. The domain/service
 * layer (apps/web) depends only on this interface, never on Octokit types
 * directly, per ARCHITECTURE.md 5 ("provider-specific code belongs under
 * adapters").
 */
export interface GithubAppClient {
  getInstallation(installationId: number): Promise<GithubInstallationInfo>;
  listInstallationRepositories(installationId: number): Promise<GithubInstallationRepoSummary[]>;
}

export interface GithubAppConfig {
  appId: string;
  privateKey: string;
}

export function createGithubAppClient(config: GithubAppConfig): GithubAppClient {
  const auth = createAppAuth({ appId: config.appId, privateKey: config.privateKey });

  async function getInstallationToken(installationId: number): Promise<string> {
    const installationAuth = await auth({ type: "installation", installationId });
    return installationAuth.token;
  }

  async function githubRequest<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`GitHub API request to ${path} failed: ${response.status} ${body}`.slice(0, 500));
    }

    return (await response.json()) as T;
  }

  return {
    async getInstallation(installationId) {
      // Uses an app-level (JWT) token, not an installation token, because
      // this call verifies the installation exists in the first place.
      const appAuth = await auth({ type: "app" });
      const data = await githubRequest<{
        id: number;
        account: { login: string; id: number; type: string } | null;
      }>(`/app/installations/${installationId}`, appAuth.token);

      if (!data.account) {
        throw new Error(`Installation ${installationId} has no associated account`);
      }

      return {
        installationId: data.id,
        accountLogin: data.account.login,
        accountId: data.account.id,
        accountType: data.account.type,
      };
    },

    async listInstallationRepositories(installationId) {
      const token = await getInstallationToken(installationId);
      const repositories: GithubInstallationRepoSummary[] = [];
      let page = 1;

      for (;;) {
        const data = await githubRequest<{
          repositories: Array<{
            id: number;
            name: string;
            owner: { login: string };
            private: boolean;
            default_branch: string;
          }>;
        }>(`/installation/repositories?per_page=100&page=${page}`, token);

        for (const repo of data.repositories) {
          repositories.push({
            providerRepositoryId: repo.id,
            owner: repo.owner.login,
            name: repo.name,
            isPrivate: repo.private,
            defaultBranch: repo.default_branch,
          });
        }

        if (data.repositories.length < 100) {
          break;
        }
        page += 1;
      }

      return repositories;
    },
  };
}
