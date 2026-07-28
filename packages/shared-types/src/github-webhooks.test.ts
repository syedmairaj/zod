import { describe, expect, it } from "vitest";
import { GithubInstallationPayloadSchema, GithubPullRequestPayloadSchema } from "./github-webhooks";

const validPullRequestPayload = {
  action: "opened",
  number: 7,
  pull_request: {
    id: 1,
    number: 7,
    title: "Add feature",
    state: "open",
    user: { login: "octocat" },
    head: { sha: "a".repeat(40) },
    base: { sha: "b".repeat(40) },
  },
  repository: {
    id: 42,
    name: "hello-world",
    full_name: "octocat/hello-world",
    private: false,
    owner: { login: "octocat", id: 1 },
  },
  installation: { id: 99 },
};

describe("GithubPullRequestPayloadSchema", () => {
  it("accepts a well-formed pull_request payload", () => {
    const result = GithubPullRequestPayloadSchema.safeParse(validPullRequestPayload);
    expect(result.success).toBe(true);
  });

  it("ignores unknown extra fields rather than rejecting them", () => {
    const result = GithubPullRequestPayloadSchema.safeParse({
      ...validPullRequestPayload,
      sender: { login: "octocat" },
      some_future_field: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing required fields", () => {
    const { pull_request: _omit, ...withoutPullRequest } = validPullRequestPayload;
    const result = GithubPullRequestPayloadSchema.safeParse(withoutPullRequest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid action value", () => {
    const result = GithubPullRequestPayloadSchema.safeParse({ ...validPullRequestPayload, action: "labeled" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-object payload", () => {
    expect(GithubPullRequestPayloadSchema.safeParse(null).success).toBe(false);
    expect(GithubPullRequestPayloadSchema.safeParse("not an object").success).toBe(false);
  });
});

describe("GithubInstallationPayloadSchema", () => {
  it("accepts a well-formed installation payload", () => {
    const result = GithubInstallationPayloadSchema.safeParse({
      action: "created",
      installation: { id: 1, account: { login: "octocat", id: 2, type: "Organization" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown action", () => {
    const result = GithubInstallationPayloadSchema.safeParse({
      action: "renamed",
      installation: { id: 1, account: { login: "octocat", id: 2 } },
    });
    expect(result.success).toBe(false);
  });
});
