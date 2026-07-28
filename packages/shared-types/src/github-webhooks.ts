import { z } from "zod";

/**
 * Minimal, deliberately narrow schemas for the GitHub webhook payload shapes
 * Milestone 1 actually consumes. We do not model the full GitHub webhook
 * schema; unknown/extra fields are ignored (not rejected) but every field we
 * rely on downstream is validated before use, per AGENTS.md ("Validate all
 * external input").
 */

export const GithubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  default_branch: z.string().optional(),
  owner: z.object({
    login: z.string(),
    id: z.number(),
  }),
});

export const GithubPullRequestPayloadSchema = z.object({
  action: z.enum([
    "opened",
    "synchronize",
    "reopened",
    "closed",
    "edited",
    "ready_for_review",
  ]),
  number: z.number(),
  pull_request: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.enum(["open", "closed"]),
    merged: z.boolean().optional(),
    user: z.object({ login: z.string() }),
    head: z.object({ sha: z.string() }),
    base: z.object({ sha: z.string() }),
  }),
  repository: GithubRepositorySchema,
  installation: z.object({ id: z.number() }).optional(),
});

export const GithubInstallationPayloadSchema = z.object({
  action: z.enum([
    "created",
    "deleted",
    "suspend",
    "unsuspend",
    "new_permissions_accepted",
  ]),
  installation: z.object({
    id: z.number(),
    account: z.object({
      login: z.string(),
      id: z.number(),
      type: z.string().optional(),
    }),
  }),
});

export const GithubPingPayloadSchema = z.object({
  zen: z.string().optional(),
  hook_id: z.number().optional(),
});

export type GithubPullRequestPayload = z.infer<typeof GithubPullRequestPayloadSchema>;
export type GithubInstallationPayload = z.infer<typeof GithubInstallationPayloadSchema>;
