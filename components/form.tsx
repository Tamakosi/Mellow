"use client";

import { useState, type ReactNode } from "react";
import { Icon, cx, pill, primary } from "./ui";

/** Base look for text inputs and selects. Border is the 3:1 input token; errors switch it to danger. */
export const inputClass = (invalid = false) =>
  cx(
    "min-h-12 w-full rounded-2xl border bg-surface px-4 text-base",
    invalid ? "border-danger" : "border-line-input",
  );

/** ids for aria-describedby: hint first, then error. */
export const describedBy = (id: string) => `${id}-hint ${id}-error`;

/** Label, control, helper text shown before input, and an inline error that says how to fix it. */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      <p id={`${id}-hint`} className={cx("text-[0.8125rem] text-muted", !hint && "sr-only")}>
        {hint}
      </p>
      <p id={`${id}-error`} className={cx("flex items-start gap-1.5 text-[0.8125rem] font-semibold text-danger", !error && "sr-only")}>
        {error && <Icon name="close" size={14} stroke={2.4} className="mt-[3px]" />}
        {error}
      </p>
    </div>
  );
}

/**
 * Password input with an eye toggle. The name stays "Show password" and `aria-pressed` carries the state,
 * so screen readers hear "Show password, pressed" while it is visible; the icon follows the usual convention
 * (an open eye to reveal, a crossed-out eye to hide).
 */
export function PasswordInput({
  id,
  value,
  onChange,
  invalid,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  autoComplete: "current-password" | "new-password";
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={describedBy(id)}
        className={cx(inputClass(invalid), "pr-14")}
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={shown}
        title={shown ? "Hide password" : "Show password"}
        onClick={() => setShown(!shown)}
        className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-green-deep hover:bg-ground"
      >
        <Icon name={shown ? "eye-off" : "eye"} size={20} stroke={1.8} />
      </button>
    </div>
  );
}

/** On/off setting. The label describes the ON state. */
export function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex min-w-0 flex-col">
        <span id={`${id}-label`} className="font-semibold">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="text-[0.8125rem] text-muted">
            {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={cx(
          "still relative h-8 w-14 shrink-0 rounded-full border-2 motion-safe:transition-colors before:absolute before:-inset-x-1.5 before:-inset-y-[8px] before:content-['']",
          checked ? "border-ink bg-ink" : "border-line-input bg-surface",
        )}
      >
        <span
          className={cx(
            "absolute left-0.5 top-0.5 flex size-6 items-center justify-center rounded-full motion-safe:transition-transform",
            checked ? "translate-x-6 bg-white text-ink" : "bg-line-input text-white",
          )}
        >
          {checked && <Icon name="check" size={12} stroke={3} />}
        </span>
      </button>
    </div>
  );
}

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Appears when a form has unsaved edits. Discard is the undo; failures keep the edits and offer a retry. */
export function SaveBar({
  dirty,
  state,
  onSave,
  onDiscard,
  label = "Save changes",
}: {
  dirty: boolean;
  state: SaveState;
  onSave: () => void;
  onDiscard: () => void;
  label?: string;
}) {
  const message =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Changes saved."
        : state === "error"
          ? "Couldn’t save. Check your connection, then try again. Your edits are still here."
          : dirty
            ? "You have unsaved changes."
            : "";
  return (
    <div
      className={cx(
        "sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border bg-surface px-5 py-3 shadow-pop max-md:mr-[72px]",
        state === "error" ? "border-danger" : "border-line",
        !dirty && state !== "saved" && "hidden",
      )}
    >
      <p role="status" className={cx("text-sm font-medium", state === "error" ? "text-danger" : "text-muted")}>
        {message}
      </p>
      {dirty && (
        <div className="flex gap-2">
          <button type="button" onClick={onDiscard} disabled={state === "saving"} className={pill}>
            Discard
          </button>
          <button type="button" onClick={onSave} disabled={state === "saving"} className={cx(primary, "min-h-11 text-[0.9375rem]")}>
            {state === "error" ? "Try again" : state === "saving" ? "Saving…" : label}
          </button>
        </div>
      )}
    </div>
  );
}

/** Fake network call for the prototype: fails when the browser is offline, so the error path can be tried. */
export function fakeSave(ms = 700) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => (typeof navigator !== "undefined" && !navigator.onLine ? reject(new Error("offline")) : resolve()), ms),
  );
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
