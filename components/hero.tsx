import type { JSX } from 'react';
import Image from 'next/image';
import { ButtonLink } from './ui/controls';

const DISCIPLINES = [
  'Conservation Framing',
  'Display Systems',
  'White-Glove Installation',
] as const;

export function Hero(): JSX.Element {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="relative min-h-[92svh] w-full overflow-hidden">
        <Image
          src="/images/enchanted-sky.svg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="enchanted-hero-art object-cover"
        />
        <div className="enchanted-hero-shade absolute inset-0" />

        <div className="relative flex min-h-[92svh] flex-col">
          <div className="enchanted-hero-copy mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-28 sm:px-8">
            <span className="label-eyebrow text-white/70">
              Framing &amp; Display — New York
            </span>
            <h1 className="font-editorial mt-8 max-w-4xl text-[3.75rem] leading-[0.92] text-white text-balance sm:text-[7rem]">
              Made to be seen.
            </h1>
            <p className="mt-8 max-w-md text-copy-18 leading-relaxed text-white/80 text-pretty">
              A New York studio for museum-grade framing and display — designed,
              fabricated, and installed for spaces that leave an impression.
            </p>
            <div className="mt-12 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="#contact" size="large" suffix={
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-4">
                  <path d="M2.5 8h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }>
                Start a Project
              </ButtonLink>
              <ButtonLink href="#about" variant="secondary" size="large">
                Explore the Studio
              </ButtonLink>
            </div>
          </div>

          <div className="mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/20 pt-6">
              <span className="label-eyebrow text-white/50">Est. 1998</span>
              {DISCIPLINES.map((d) => (
                <span key={d} className="label-eyebrow text-white/50">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
