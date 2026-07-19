"use client";

/**
 * Phase 2G test-only harness child — NOT production SettingsHubClient.
 * Tracks mount/unmount and local state for browser continuity probes.
 * Only used under HOMECHEFF_AW_SETTINGS_HARNESS=1.
 */

import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    __AW_PHASE2G_PROBE__?: {
      mounts: number;
      unmounts: number;
      renders: number;
    };
  }
}

export default function SettingsWorkspaceHarnessChild() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const w = window;
    w.__AW_PHASE2G_PROBE__ = w.__AW_PHASE2G_PROBE__ ?? {
      mounts: 0,
      unmounts: 0,
      renders: 0,
    };
    w.__AW_PHASE2G_PROBE__.mounts += 1;
    w.__AW_PHASE2G_PROBE__.renders += 1;
    return () => {
      if (w.__AW_PHASE2G_PROBE__) {
        w.__AW_PHASE2G_PROBE__.unmounts += 1;
      }
    };
  }, []);

  return (
    <div
      data-aw-harness-child=""
      className="min-h-screen hc-dorpsplein-page pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Settings Workspace Harness
          </h1>
          <p className="text-base text-gray-600 mt-2 max-w-xl leading-relaxed">
            Phase 2G continuity fixture — not production Settings.
          </p>
        </header>

        <nav aria-label="Harness tabs" className="flex gap-2 mb-6">
          <button
            type="button"
            data-aw-harness-tab="profile"
            className="px-4 py-3 rounded-xl text-sm font-medium bg-white border border-gray-200"
          >
            Profile
          </button>
          <button
            type="button"
            data-aw-harness-tab="privacy"
            className="px-4 py-3 rounded-xl text-sm font-medium bg-white border border-gray-200"
          >
            Privacy
          </button>
        </nav>

        <label className="block text-sm text-gray-700 mb-2" htmlFor="aw-harness-input">
          Local text (continuity)
        </label>
        <input
          id="aw-harness-input"
          data-aw-harness-input=""
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2"
        />

        <button
          type="button"
          data-aw-harness-disclosure=""
          className="mt-4 block text-sm text-gray-700 underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide details" : "Show details"}
        </button>
        {open ? (
          <p data-aw-harness-disclosure-body="" className="mt-2 text-sm text-gray-600">
            Disclosure body for continuity
          </p>
        ) : null}
      </div>
    </div>
  );
}
