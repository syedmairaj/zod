import { describe, expect, it } from "vitest";
import { extractCommitSha, extractGithubWebhookAction, parseGithubWebhookEvent } from "./parse";

describe("extractGithubWebhookAction", () => {
  it("returns the top-level action string when present", () => {
    expect(extractGithubWebhookAction({ action: "synchronize" })).toBe("synchronize");
    expect(extractGithubWebhookAction({ action: "new_permissions_accepted" })).toBe(
      "new_permissions_accepted",
    );
  });

  it("returns null for push/ping-style payloads without action", () => {
    expect(extractGithubWebhookAction({ ref: "refs/heads/main", after: "a".repeat(40) })).toBeNull();
    expect(extractGithubWebhookAction({ zen: "non-blocking" })).toBeNull();
  });

  it("returns null for non-string or empty action values", () => {
    expect(extractGithubWebhookAction({ action: 1 })).toBeNull();
    expect(extractGithubWebhookAction({ action: "" })).toBeNull();
    expect(extractGithubWebhookAction(null)).toBeNull();
  });
});

describe("parseGithubWebhookEvent", () => {
  it("parses pull_request payloads", () => {
    const event = parseGithubWebhookEvent("pull_request", {
      action: "opened",
      number: 1,
      pull_request: {
        id: 1,
        number: 1,
        title: "Test",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: "a".repeat(40) },
        base: { sha: "b".repeat(40) },
      },
      repository: {
        id: 99,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: 123 },
    });
    expect(event.kind).toBe("pull_request");
    expect(extractCommitSha(event)).toBe("a".repeat(40));
  });

  it("parses push payloads and extracts after SHA", () => {
    const event = parseGithubWebhookEvent("push", {
      ref: "refs/heads/main",
      after: "c".repeat(40),
      repository: {
        id: 99,
        name: "repo",
        full_name: "acme/repo",
        private: false,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: 123 },
    });
    expect(event.kind).toBe("push");
    expect(extractCommitSha(event)).toBe("c".repeat(40));
  });

  it("returns unsupported for unknown events", () => {
    const event = parseGithubWebhookEvent("issues", { action: "opened" });
    expect(event).toEqual({ kind: "unsupported", eventType: "issues" });
  });

  it("parses installation_repositories removals", () => {
    const event = parseGithubWebhookEvent("installation_repositories", {
      action: "removed",
      installation: { id: 7 },
      repositories_removed: [{ id: 1, name: "gone" }],
      repositories_added: [],
    });
    expect(event.kind).toBe("installation_repositories");
  });
});
