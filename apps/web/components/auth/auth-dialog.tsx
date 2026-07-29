"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AuthPanel } from "./auth-panel";

interface AuthDialogProps {
  errorCode?: string | null;
  nextPath?: string | null;
}

/**
 * Accessible modal wrapper for the intercepted `/sign-in` route.
 * Uses native <dialog> for focus trap + Escape; Back closes via router.back().
 */
export function AuthDialog({ errorCode, nextPath }: AuthDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerReturnRef = useRef<Element | null>(null);
  const closedByUserRef = useRef(false);

  useEffect(() => {
    triggerReturnRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";
    } catch {
      // If showModal fails (rare browser edge cases), still show content in-flow.
    }

    return () => {
      document.body.style.overflow = "";
      const trigger = triggerReturnRef.current;
      if (trigger instanceof HTMLElement) {
        try {
          trigger.focus();
        } catch {
          // Ignore focus restoration failures during unmount.
        }
      }
    };
  }, []);

  function requestClose() {
    closedByUserRef.current = true;
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
      return;
    }
    router.back();
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-panel-title"
      aria-describedby="auth-panel-desc"
      onClose={() => {
        document.body.style.overflow = "";
        if (closedByUserRef.current) {
          router.back();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div className="auth-dialog-sheet">
        <button type="button" className="auth-dialog-close" aria-label="Close sign in" onClick={requestClose}>
          Close
        </button>
        <AuthPanel errorCode={errorCode} nextPath={nextPath} />
      </div>
    </dialog>
  );
}
