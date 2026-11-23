import type { JSX } from 'react';
import Image from 'next/image';
import { PartyWizard } from './party-wizard';

const SERVICES = [
  {
    name: 'Display design',
    description:
      'Thoughtful layouts, material palettes, and display concepts that bring art, objects, and brand stories into focus — shaped around your collection and your space.',
  },
  {
    name: 'Custom framing & fabrication',
    description:
      'Conservation-grade framing, bespoke display cases, and precision-built mounts, made by hand in our New York workshop to protect and present every piece.',
  },
  {
    name: 'On-site installation',
    description:
      'White-glove placement and installation for offices, galleries, and retail spaces. Our team handles the finishing details so your complete display is ready to be seen.',
  },
] as const;

export function Services(): JSX.Element {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative scroll-mt-24 py-20 before:absolute before:-inset-x-5 before:top-0 before:border-t before:border-[var(--ds-gray-alpha-400)] before:content-[''] sm:py-28 sm:before:inset-x-0"
    >
      <div className="mb-10 flex max-w-2xl flex-col gap-4 lg:mb-12">
        <span className="label-eyebrow text-gray-700">Services</span>
        <h2
          id="services-heading"
          className="font-editorial text-heading-32 text-gray-1000 text-balance sm:text-[2.75rem] sm:leading-[1.05]"
        >
          More than a frame. A complete display.
        </h2>
        <p className="text-copy-16 text-gray-900 text-pretty sm:text-copy-18">
          We design, build, and install considered displays for art, objects,
          and spaces. From the first concept to the final placement, one studio
          brings every detail together.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <figure className="flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--ds-gray-alpha-400)]">
              <Image
                src="/images/display-case.png"
                alt="Custom glass display case presenting objects in a gallery setting"
                fill
                sizes="(min-width: 1024px) 456px, (min-width: 961px) 45vw, (min-width: 401px) calc(100vw - 64px), calc(100vw - 40px)"
                className="object-cover"
              />
            </div>
            <figcaption className="font-editorial mt-4 text-copy-16 italic text-gray-900">
              Designed for the object. Built for the space.
            </figcaption>
          </figure>
          <PartyWizard />
        </div>

        <ul className="flex flex-col border-t border-[var(--ds-gray-alpha-400)]">
          {SERVICES.map((service) => (
            <li
              key={service.name}
              className="flex flex-col gap-3 border-b border-[var(--ds-gray-alpha-400)] py-6"
            >
              <h3 className="font-editorial text-heading-24 text-gray-1000">
                {service.name}
              </h3>
              <p className="text-copy-16 text-gray-900 text-pretty">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
