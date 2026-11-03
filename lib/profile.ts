"use client";

import { useSyncExternalStore } from "react";

/** The signed-in person's profile. Prototype: kept in this browser only, so it survives a reload. */
export type Profile = { name: string; email: string; role: string; language: string };

const KEY = "mellow-profile";
export const DEFAULT_PROFILE: Profile = { name: "[YOUR NAME]", email: "you@example.com", role: "Teacher", language: "English" };

/** `stored` is false until a saved profile has been read, so a page can re-seed its form once after loading. */
type Snapshot = Profile & { stored: boolean };
const DEFAULT_SNAPSHOT: Snapshot = { ...DEFAULT_PROFILE, stored: false };

const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let lastSnapshot: Snapshot = DEFAULT_SNAPSHOT;

function read(): Snapshot {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode, settings): fall back to the defaults.
  }
  // useSyncExternalStore needs the same object back while nothing changed.
  if (raw === lastRaw) return lastSnapshot;
  lastRaw = raw;
  try {
    lastSnapshot = raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw), stored: true } : DEFAULT_SNAPSHOT;
  } catch {
    lastSnapshot = DEFAULT_SNAPSHOT;
  }
  return lastSnapshot;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Not saved across reloads; this page still shows the new values.
  }
  listeners.forEach((notify) => notify());
}

/** The current profile; the defaults during server rendering and before anything is saved. */
export function useProfile() {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SNAPSHOT);
}
