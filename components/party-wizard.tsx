'use client';

import { useId, useState, type JSX } from 'react';

export function PartyWizard(): JSX.Element {
  const [paused, setPaused] = useState(false);
  const figureId = useId();

  return (
    <div className="mt-8 flex items-center gap-5 border border-[var(--ds-gray-alpha-400)] bg-[#f2eef7] px-5 py-4">
      <div
        id={figureId}
        role="img"
        aria-label="A party wizard in a purple robe and golden party hat, dancing with a star wand"
        className="party-wizard size-24 shrink-0"
        data-paused={paused}
      >
        <svg aria-hidden="true" viewBox="-12 -16 144 136" fill="none" className="size-full">
          <ellipse cx="60" cy="111" rx="30" ry="4" fill="#ddd4e8" />
          <g className="party-wizard-dancer">
            <path d="m45 98-9 11h17l4-12m15 0 12 12H68l-5-12" fill="#352b47" />
            <path d="M47 57 28 91l15 10 17-20 16 20 17-10-20-34Z" fill="#76539c" />
            <path d="m47 63-21 3-10-14m57 12 22-9 7-19" stroke="#76539c" strokeWidth="12" strokeLinecap="round" />
            <path d="m16 52-4-7m90-9 2-9" stroke="#d39971" strokeWidth="8" strokeLinecap="round" />
            <path d="m100 34 10-25" stroke="#76502d" strokeWidth="3" />
            <path d="m110 3 2 5 6 1-5 4 1 6-5-3-5 2 1-6-4-4 6-1Z" fill="#d0a13e" />
            <circle cx="60" cy="46" r="16" fill="#e5b28d" />
            <path d="M46 48q14 17 28 0-1 30-14 34-14-9-14-34" fill="#fffaf0" />
            <path d="m41 33 18-30 21 34Z" fill="#d0a13e" />
            <path d="m49 20 20 4m-14-13 8 2" stroke="#fff1bf" strokeWidth="3" />
            <path d="M36 37q25-9 48 2" stroke="#352b47" strokeWidth="5" strokeLinecap="round" />
            <circle cx="54" cy="44" r="1.5" fill="#352b47" />
            <circle cx="65" cy="44" r="1.5" fill="#352b47" />
            <path d="m54 91 3-6 3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4Z" fill="#ead79a" />
          </g>
        </svg>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <p className="font-editorial text-heading-20">A little display magic.</p>
        <p className="text-copy-14 text-gray-900">Our resident party wizard.</p>
        <button
          type="button"
          aria-controls={figureId}
          onClick={() => setPaused((value) => !value)}
          className="min-h-11 cursor-pointer text-copy-14 text-gray-1000 underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76539c] motion-reduce:hidden"
        >
          {paused ? 'Play dance' : 'Pause dance'}
        </button>
      </div>
    </div>
  );
}
