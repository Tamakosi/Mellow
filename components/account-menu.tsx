"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { initials } from "@/lib/initials";
import { useProfile } from "@/lib/profile";
import { Icon } from "./ui";
import { useDismiss } from "./use-dismiss";

/** Account button with a small menu. Shows the name and email saved on the profile page. */
export function AccountMenu() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrapper, open, close, trigger);

  const item = "flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-ground";

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-accent-tint text-sm font-semibold"
      >
        <span aria-hidden="true">{initials(profile.name) || <Icon name="smile" size={20} />}</span>
      </button>
      {open && (
        <div aria-label="Account" role="group" className="pop absolute right-0 top-14 z-40 flex w-60 flex-col gap-0.5 rounded-[20px] border border-line bg-surface p-2 shadow-pop">
          {/* Names and emails come from the person, so long ones wrap instead of running out of the menu. */}
          <div className="px-3 pb-2 pt-1.5 [overflow-wrap:anywhere]">
            <div className="font-semibold">{profile.name}</div>
            <div className="text-[0.8125rem] text-muted">{profile.email}</div>
          </div>
          <Link href="/account" className={item} onClick={close}>
            Profile
          </Link>
          <Link href="/settings" className={item} onClick={close}>
            Settings
          </Link>
          <Link href="/brand-kit" className={item} onClick={close}>
            Brand kit
          </Link>
          <Link href="/create#recent" className={item} onClick={close}>
            My decks
          </Link>
          <div className="my-1 border-t border-divider" />
          <Link href="/login" className={item} onClick={close}>
            Log out
          </Link>
        </div>
      )}
    </div>
  );
}
