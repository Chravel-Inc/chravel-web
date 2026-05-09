import React from 'react';

export const AuthBrandWordmark = () => {
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
};
