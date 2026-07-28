"use client";

import { useFormState, useFormStatus } from "react-dom";
import { connectRepositoriesAction, type ConnectReposState } from "./actions";
import type { GithubInstallationRepoSummary } from "@zod-ai/github";

const initialState: ConnectReposState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "Connecting…" : "Connect selected repositories"}
    </button>
  );
}

export function ConnectRepositoriesForm({
  organizationId,
  installationRowId,
  repositories,
}: {
  organizationId: string;
  installationRowId: string;
  repositories: GithubInstallationRepoSummary[];
}) {
  const [state, formAction] = useFormState(connectRepositoriesAction, initialState);

  return (
    <form action={formAction} className="card">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="installationRowId" value={installationRowId} />
      {repositories.map((repo) => (
        <label key={repo.providerRepositoryId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <input type="checkbox" name="providerRepositoryId" value={repo.providerRepositoryId} />
          <span className="mono">
            {repo.owner}/{repo.name}
          </span>
          <span className="muted">{repo.isPrivate ? "private" : "public"}</span>
        </label>
      ))}
      <div style={{ marginTop: 16 }}>
        <SubmitButton />
      </div>
      {state.status === "error" ? <p className="error-banner" style={{ marginTop: 16 }}>{state.message}</p> : null}
    </form>
  );
}
