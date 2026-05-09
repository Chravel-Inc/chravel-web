import React from 'react';

/**
 * Gold ChravelApp wordmark fixed above the auth modal on full-screen auth surfaces.
 * Renders at z-[101] so it stays visible over AuthModal’s backdrop (z-[100]).
 * Used by `/auth` and the installed-app unauthenticated gate on `/` so dismissing
 * auth and landing on `/` does not drop the brand treatment.
 */
export function AuthBrandHeader(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-[101] flex justify-center px-4"
      style={{ top: 'max(env(safe-area-inset-top), 24px)' }}
    >
      <span className="gold-gradient-text text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        ChravelApp
      </span>
    </div>
  );
}
