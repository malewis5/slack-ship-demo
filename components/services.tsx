import type { JSX } from 'react';
import Image from 'next/image';

const SERVICES = [
  {
    name: 'Design',
    description:
      'We plan complete displays around your space, collection, and story — from layouts and material selections to custom frames and display cases.',
  },
  {
    name: 'Build',
    description:
      'Our New York workshop brings the design to life with custom framing, display cases, and mounts, crafted to present art, objects, and products with care.',
  },
  {
    name: 'Install',
    description:
      'We handle on-site installation, placing and securing every element so your complete display is ready to be seen.',
  },
] as const;

export function Services(): JSX.Element {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative grid scroll-mt-24 grid-cols-1 gap-10 py-20 before:absolute before:-inset-x-5 before:top-0 before:border-t before:border-[var(--ds-gray-alpha-400)] before:content-[''] sm:py-28 sm:before:inset-x-0 lg:grid-cols-12 lg:gap-12"
    >
      <div className="flex flex-col gap-6 lg:col-span-6">
        <span className="label-eyebrow text-gray-700">Services</span>
        <h2
          id="services-heading"
          className="font-editorial max-w-xl text-heading-32 text-gray-1000 text-balance sm:text-[2.75rem] sm:leading-[1.05]"
        >
          More than framing. Complete displays, from design to installation.
        </h2>
        <p className="max-w-xl text-copy-16 text-gray-900 text-pretty sm:text-copy-18">
          One studio for every step. We design, build, and install displays for
          offices, galleries, and brands — bringing art, objects, and stories
          together in a considered space.
        </p>
        <ul className="flex flex-col border-t border-[var(--ds-gray-alpha-400)]">
          {SERVICES.map((service) => (
            <li
              key={service.name}
              className="flex flex-col gap-2 border-b border-[var(--ds-gray-alpha-400)] py-6"
            >
              <h3 className="font-editorial text-heading-24 text-gray-1000">
                {service.name}
              </h3>
              <p className="max-w-xl text-copy-14 text-gray-900 text-pretty sm:text-copy-16">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <figure className="flex flex-col lg:col-span-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--ds-gray-alpha-400)]">
          <Image
            src="/images/display-case.png"
            alt="Custom display case showcasing objects"
            fill
            sizes="(min-width: 1024px) 480px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
            className="object-cover"
          />
        </div>
        <figcaption className="font-editorial mt-4 text-copy-16 italic text-gray-900">
          Custom framing and display — designed, built, and installed by one studio.
        </figcaption>
      </figure>
    </section>
  );
}
