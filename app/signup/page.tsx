"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, PasswordInput, describedBy, inputClass, isEmail } from "@/components/form";
import { Icon, cx, primary } from "@/components/ui";

/** Prototype rule: this address is treated as already registered. */
const TAKEN = "taken@example.com";

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "A number or a symbol", test: (p: string) => /[\d\W_]/.test(p) },
];

type Errors = { name?: string; email?: string; password?: string; terms?: string };

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your name so we know what to call you.";
    if (!isEmail(email)) next.email = "Enter an email address, like name@example.com.";
    if (!RULES.every((r) => r.test(password))) next.password = "Choose a password that meets both rules below.";
    if (!terms) next.terms = "Tick the box to agree to the terms before creating your account.";
    setErrors(next);
    setTaken(false);
    const first = (["name", "email", "password", "terms"] as const).find((k) => next[k]);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setBusy(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === TAKEN) {
        setBusy(false);
        setTaken(true);
        document.getElementById("email")?.focus();
        return;
      }
      router.push("/create");
    }, 800);
  };

  return (
    <AuthShell
      title="Create your account"
      intro={
        <>
          Already have one?{" "}
          <Link href="/login" className="font-semibold text-green-deep underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field id="name" label="Your name" error={errors.name}>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field
          id="email"
          label="Email"
          error={
            errors.email ??
            (taken ? "An account with this email already exists. Log in instead, or use a different email." : undefined)
          }
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTaken(false);
            }}
            aria-invalid={!!errors.email || taken}
            aria-describedby={describedBy("email")}
            className={inputClass(!!errors.email || taken)}
          />
        </Field>
        {taken && (
          <Link href="/login" className="-my-3 inline-flex min-h-11 items-center self-start text-sm font-semibold text-green-deep underline underline-offset-4">
            Log in with {email.trim()}
          </Link>
        )}

        <div className="flex flex-col gap-2">
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput id="password" value={password} onChange={setPassword} invalid={!!errors.password} autoComplete="new-password" />
          </Field>
          <ul aria-label="Password rules" className="-mt-1 flex flex-col gap-1 text-[0.8125rem]">
            {RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.label} className={cx("flex items-center gap-2", met ? "text-green-deep" : "text-muted")}>
                  <span className={cx("flex size-4 items-center justify-center rounded-full", met ? "bg-green-deep text-white" : "border border-line-input")}>
                    {met && <Icon name="check" size={10} stroke={3} />}
                  </span>
                  {rule.label}
                  <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={!!errors.terms}
              aria-describedby="terms-error"
              className="mt-0.5 size-5 shrink-0 accent-ink"
            />
            {/* 24px lines + a 2px nudge put the 20px box on the centre of the first line, even when the text wraps. */}
            <span className="text-sm leading-6">
              I agree to the{" "}
              <a href="#" className="font-semibold text-green-deep underline underline-offset-4">
                terms of use
              </a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-green-deep underline underline-offset-4">
                privacy policy
              </a>
              .
            </span>
          </label>
          <p id="terms-error" className={cx("text-[0.8125rem] font-semibold text-danger", !errors.terms && "sr-only")}>
            {errors.terms}
          </p>
        </div>

        <button type="submit" disabled={busy} className={cx(primary, "w-full")}>
          {busy ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="rounded-2xl bg-ground px-4 py-3 text-[0.8125rem] text-muted">
        Prototype: nothing is stored. Use <code className="font-semibold text-ink">{TAKEN}</code> to see the “email already used” case.
      </p>
    </AuthShell>
  );
}
