"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  connectRepositoriesAction,
  deselectRepositoryAction,
  disconnectInstallationAction,
  refreshInstallationAction,
  type ConnectRepositoriesState,
} from "./actions";
import type { GithubInstallationRepoSummary } from "@zod-ai/github";

const initialState: ConnectRepositoriesState = { status: "idle" };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? pendingLabel : label}
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
        <label
          key={repo.providerRepositoryId}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
        >
          <input type="checkbox" name="providerRepositoryId" value={repo.providerRepositoryId} />
          <span className="mono">
            {repo.owner}/{repo.name}
          </span>
          <span className="muted">{repo.isPrivate ? "private" : "public"}</span>
        </label>
      ))}
      <div style={{ marginTop: 16 }}>
        <SubmitButton label="Connect selected repositories" pendingLabel="Connecting…" />
      </div>
      {state.status === "error" ? (
        <p className="error-banner" style={{ marginTop: 16 }}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function InstallationActionsForm({
  organizationId,
  installationRowId,
}: {
  organizationId: string;
  installationRowId: string;
}) {
  const [refreshState, refreshAction] = useFormState(refreshInstallationAction, initialState);
  const [disconnectState, disconnectAction] = useFormState(disconnectInstallationAction, initialState);

  return (
    <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <form action={refreshAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="installationRowId" value={installationRowId} />
        <SubmitButton label="Refresh access" pendingLabel="Refreshing…" />
      </form>
      <form action={disconnectAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="installationRowId" value={installationRowId} />
        <button type="submit" className="button-secondary">
          Disconnect installation
        </button>
      </form>
      {refreshState.status === "ok" ? <p className="muted">{refreshState.message}</p> : null}
      {refreshState.status === "error" ? <p className="error-banner">{refreshState.message}</p> : null}
      {disconnectState.status === "error" ? <p className="error-banner">{disconnectState.message}</p> : null}
    </div>
  );
}

export function ConnectedRepositoriesPanel({
  organizationId,
  repositories,
}: {
  organizationId: string;
  repositories: Array<{
    id: string;
    owner: string;
    name: string;
    status: string;
    is_private: boolean;
    disconnected_at: string | null;
  }>;
}) {
  const [state, formAction] = useFormState(deselectRepositoryAction, initialState);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>Connected repositories</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Display name is <span className="mono">owner/name</span>. Visibility uses <span className="mono">is_private</span>.
        Connection state uses <span className="mono">status</span>.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {repositories.map((repo) => (
          <li
            key={repo.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div>
              <span className="mono">
                {repo.owner}/{repo.name}
              </span>{" "}
              <span className="muted">
                {repo.is_private ? "private" : "public"} · {repo.status}
                {repo.disconnected_at ? ` · disconnected ${repo.disconnected_at}` : ""}
              </span>
            </div>
            {repo.status === "active" ? (
              <form action={formAction}>
                <input type="hidden" name="organizationId" value={organizationId} />
                <input type="hidden" name="repositoryId" value={repo.id} />
                <button type="submit" className="button-secondary">
                  Deselect
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {state.status === "ok" ? <p className="muted">{state.message}</p> : null}
      {state.status === "error" ? <p className="error-banner">{state.message}</p> : null}
    </div>
  );
}
