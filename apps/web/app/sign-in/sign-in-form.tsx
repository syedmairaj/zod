"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestMagicLink, type SignInState } from "./actions";

const initialState: SignInState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "Sending…" : "Send sign-in link"}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useFormState(requestMagicLink, initialState);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 360 }}>
      <label className="label" htmlFor="email">
        Work email
      </label>
      <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
      <div style={{ marginTop: 16 }}>
        <SubmitButton />
      </div>
      {state.status === "sent" ? <p className="success-banner" style={{ marginTop: 16 }}>{state.message}</p> : null}
      {state.status === "error" ? <p className="error-banner" style={{ marginTop: 16 }}>{state.message}</p> : null}
    </form>
  );
}
