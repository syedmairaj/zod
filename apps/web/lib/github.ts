import "server-only";
import { createGithubAppClient, type GithubAppClient } from "@zod-ai/github";
import { getServerEnv, normalizePemPrivateKey } from "./env.server";

let cachedClient: GithubAppClient | null = null;

export function getGithubAppClient(): GithubAppClient {
  if (!cachedClient) {
    const env = getServerEnv();
    cachedClient = createGithubAppClient({
      appId: env.GITHUB_APP_ID,
      privateKey: normalizePemPrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    });
  }
  return cachedClient;
}

export function getGithubAppInstallUrl(state: string): string {
  const env = getServerEnv();
  return `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new?state=${encodeURIComponent(state)}`;
}
