import React from 'react';

const GOLD_GRADIENT_TEXT: React.CSSProperties = {
  background: 'linear-gradient(135deg, #7ba4d9 0%, #c49746 35%, #e8af48 50%, #c49746 65%, #7ba4d9 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

/**
 * Cold-start / Suspense fallback: approved marketing splash (ChravelApp + globe + tagline).
 * Uses inline gradient styles so text stays on-brand even if Tailwind tokens are not ready yet.
 */
export function BrandBootSplash(): React.ReactElement {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-center"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading ChravelApp"
    >
      <h1
        className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-8"
        style={GOLD_GRADIENT_TEXT}
      >
        ChravelApp
      </h1>

      <div className="flex flex-col items-center gap-6 max-w-lg">
        <img
          src="/chravel-pwa-icon.png"
          alt=""
          width={160}
          height={160}
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_0_24px_rgba(196,151,70,0.35)]"
          decoding="async"
        />
        <p
          className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight"
          style={GOLD_GRADIENT_TEXT}
        >
          Less chaos, more coordination
        </p>
      </div>
    </div>
  );
}
