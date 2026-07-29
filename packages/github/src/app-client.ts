import { createAppAuth } from "@octokit/auth-app";

const GITHUB_API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

export interface GithubInstallationInfo {
  installationId: number;
  accountLogin: string;
  /** Decimal string — avoids unsafe JS number coercion for 64-bit ids. */
  accountId: string;
  accountType: string;
  /** Exact permissions map returned by GitHub (may be empty). */
  permissions: Record<string, string>;
}

export interface GithubInstallationRepoSummary {
  providerRepositoryId: number;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export type GithubApiFailureKind = "timeout" | "rate_limit" | "http_error" | "network";

export class GithubApiError extends Error {
  readonly kind: GithubApiFailureKind;
  readonly status: number | null;

  constructor(kind: GithubApiFailureKind, message: string, status: number | null = null) {
    super(message);
    this.name = "GithubApiError";
    this.kind = kind;
    this.status = status;
  }
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
    // Ephemeral only — never persist, log, or return this value to callers
    // outside this module's request helpers.
    const installationAuth = await auth({ type: "installation", installationId });
    return installationAuth.token;
  }

  async function githubRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${GITHUB_API_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": API_VERSION,
          ...(init?.headers ?? {}),
        },
        signal: init?.signal,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "AbortError" || name === "TimeoutError") {
        throw new GithubApiError("timeout", `GitHub API request to ${path} timed out`);
      }
      throw new GithubApiError("network", `GitHub API request to ${path} failed to connect`);
    }

    if (response.status === 403) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        throw new GithubApiError("rate_limit", `GitHub API rate limit exceeded for ${path}`, 403);
      }
    }

    if (!response.ok) {
      // Do not include response bodies in thrown messages — they may contain
      // sensitive diagnostics. Status code only is enough for operators.
      throw new GithubApiError(
        "http_error",
        `GitHub API request to ${path} failed with status ${response.status}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  }

  return {
    async getInstallation(installationId) {
      const appAuth = await auth({ type: "app" });
      const data = await githubRequest<{
        id: number;
        account: { login: string; id: number; type: string } | null;
        permissions?: Record<string, string>;
      }>(`/app/installations/${installationId}`, appAuth.token);

      if (!data.account) {
        throw new GithubApiError(
          "http_error",
          `Installation ${installationId} has no associated account`,
          null,
        );
      }

      return {
        installationId: data.id,
        accountLogin: data.account.login,
        accountId: String(data.account.id),
        accountType: data.account.type,
        permissions: data.permissions ?? {},
      };
    },

    async listInstallationRepositories(installationId) {
      const token = await getInstallationToken(installationId);
      try {
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
      } finally {
        // Best-effort: drop local reference promptly (GC). Token never leaves
        // this stack frame into persistence layers.
        void token;
      }
    },
  };
}
