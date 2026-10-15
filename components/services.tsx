import type { JSX } from 'react';
import Image from 'next/image';

const SERVICES = [
  {
    name: 'Custom framing',
    description:
      'Conservation-minded framing, with considered mouldings, mats, and glazing to protect the work and complement your space.',
  },
  {
    name: 'Display design',
    description:
      'Complete display concepts for art, objects, and products — from the layout of a collection to the details of a custom case.',
  },
  {
    name: 'Custom fabrication',
    description:
      'Frames, display cases, and mounts built by hand in our New York workshop, tailored to the pieces they hold.',
  },
  {
    name: 'Installation',
    description:
      'On-site installation with careful placement and finishing, bringing every element together so your display is ready to be seen.',
  },
] as const;

export function Services(): JSX.Element {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative scroll-mt-24 py-20 before:absolute before:-inset-x-5 before:top-0 before:border-t before:border-[var(--ds-gray-alpha-400)] before:content-[''] sm:py-28 sm:before:inset-x-0"
    >
      <div className="mb-10 flex max-w-xl flex-col gap-4">
        <span className="label-eyebrow text-gray-700">Services</span>
        <h2
          id="services-heading"
          className="font-editorial text-heading-32 text-gray-1000 text-balance sm:text-[2.75rem] sm:leading-[1.05]"
        >
          More than framing. Complete displays.
        </h2>
        <p className="text-copy-16 text-gray-900 text-pretty sm:text-copy-18">
          We design, build, and install displays for offices, galleries, and
          brands — bringing art, objects, and stories into focus, from the first
          idea to the final placement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <figure>
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--ds-gray-alpha-400)]">
            <Image
              src="/images/display-case.png"
              alt="Custom display case presenting a collection of objects"
              fill
              sizes="(min-width: 961px) 448px, (min-width: 401px) calc(100vw - 64px), calc(100vw - 40px)"
              className="object-cover"
            />
          </div>
          <figcaption className="font-editorial mt-4 text-copy-16 italic text-gray-900">
            A considered setting for the objects that matter.
          </figcaption>
        </figure>

        <ul className="flex flex-col border-t border-[var(--ds-gray-alpha-400)]">
          {SERVICES.map((service) => (
            <li
              key={service.name}
              className="flex flex-col gap-2 border-b border-[var(--ds-gray-alpha-400)] py-6"
            >
              <h3 className="font-editorial text-heading-24 text-gray-1000">
                {service.name}
              </h3>
              <p className="text-copy-14 text-gray-900 text-pretty sm:text-copy-16">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
