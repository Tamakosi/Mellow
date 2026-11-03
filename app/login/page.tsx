"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, PasswordInput, describedBy, inputClass, isEmail } from "@/components/form";
import { cx, pill, primary } from "@/components/ui";

/** Prototype rule: this password shows the "wrong password" error. Any other valid input logs in. */
const WRONG_PASSWORD = "wrong-password";

type Errors = { email?: string; password?: string; form?: string };

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset" | "reset-sent">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const logIn = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!isEmail(email)) next.email = "Enter your email address, like name@example.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (next.email || next.password) {
      document.getElementById(next.email ? "email" : "password")?.focus();
      return;
    }
    setBusy(true);
    setTimeout(() => {
      if (password === WRONG_PASSWORD) {
        setBusy(false);
        setErrors({ form: "That email and password don’t match. Check both, or reset your password." });
        document.getElementById("password")?.focus();
        return;
      }
      router.push("/create");
    }, 700);
  };

  const sendReset = (event: FormEvent) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setErrors({ email: "Enter the email address you signed up with." });
      document.getElementById("reset-email")?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMode("reset-sent");
    }, 600);
  };

  if (mode !== "login") {
    return (
      <AuthShell
        title={mode === "reset" ? "Reset your password" : "Check your email"}
        intro={
          mode === "reset"
            ? "We’ll send you a link to choose a new password."
            : `If an account exists for ${email.trim()}, a reset link is on its way. It expires in 30 minutes.`
        }
      >
        {mode === "reset" ? (
          <form onSubmit={sendReset} noValidate className="flex flex-col gap-5">
            <Field id="reset-email" label="Email" error={errors.email}>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy("reset-email")}
                className={inputClass(!!errors.email)}
              />
            </Field>
            <button type="submit" disabled={busy} className={primary}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted">Didn’t get it? Check your spam folder, or send it again.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMode("reset")} className={pill}>
                Send it again
              </button>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setMode("login")} className="inline-flex min-h-11 items-center self-start font-semibold text-green-deep underline underline-offset-4">
          Back to log in
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      intro={
        <>
          New to Mellow?{" "}
          <Link href="/signup" className="font-semibold text-green-deep underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={logIn} noValidate className="flex flex-col gap-5">
        {errors.form && (
          <div role="alert" className="rounded-2xl border border-danger bg-surface px-4 py-3 text-sm font-semibold text-danger">
            {errors.form}
          </div>
        )}
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className={inputClass(!!errors.email)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            invalid={!!errors.password || !!errors.form}
            autoComplete="current-password"
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            setErrors({});
            setMode("reset");
          }}
          className="-my-2 inline-flex min-h-11 items-center self-start text-sm font-semibold text-green-deep underline underline-offset-4"
        >
          Forgot your password?
        </button>
        <button type="submit" disabled={busy} className={cx(primary, "w-full")}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="rounded-2xl bg-ground px-4 py-3 text-[0.8125rem] text-muted">
        Prototype: any email works. Use the password <code className="font-semibold text-ink">{WRONG_PASSWORD}</code> to see a failed log-in.
      </p>
    </AuthShell>
  );
}
