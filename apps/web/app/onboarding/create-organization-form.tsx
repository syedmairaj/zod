"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createOrganizationAction, type CreateOrgState } from "./actions";

const initialState: CreateOrgState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "Creating…" : "Create organization"}
    </button>
  );
}

export function CreateOrganizationForm() {
  const [state, formAction] = useFormState(createOrganizationAction, initialState);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="name">
        Organization name
      </label>
      <input id="name" name="name" required minLength={2} maxLength={200} className="input" placeholder="Acme Inc." />
      <div style={{ marginTop: 16 }}>
        <SubmitButton />
      </div>
      {state.status === "error" ? <p className="error-banner" style={{ marginTop: 16 }}>{state.message}</p> : null}
    </form>
  );
}
