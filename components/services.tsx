import type { JSX } from 'react';
import Image from 'next/image';

const SERVICES = [
  {
    label: 'Design',
    title: 'Display design',
    description:
      'Layouts, materials, and custom display concepts that bring art, objects, and products into conversation with your space.',
  },
  {
    label: 'Build',
    title: 'Custom framing & fabrication',
    description:
      'Conservation-grade framing, bespoke display cases, and mounts, built by hand in our New York workshop to suit your collection.',
  },
  {
    label: 'Install',
    title: 'On-site installation',
    description:
      'Careful placement, secure mounting, and the finishing details that turn individual pieces into a complete, considered display.',
  },
] as const;

export function Services(): JSX.Element {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative scroll-mt-24 py-20 before:absolute before:-inset-x-5 before:top-0 before:border-t before:border-[var(--ds-gray-alpha-400)] before:content-[''] sm:py-28 sm:before:inset-x-0"
    >
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end lg:gap-12">
        <div className="flex flex-col gap-4">
          <span className="label-eyebrow text-gray-700">Services</span>
          <h2
            id="services-heading"
            className="font-editorial text-heading-32 text-gray-1000 text-balance sm:text-[2.75rem] sm:leading-[1.05]"
          >
            Beyond the frame.
            <br />
            The whole display.
          </h2>
        </div>
        <p className="max-w-xl text-copy-16 text-gray-900 text-pretty sm:text-copy-18">
          We design, build, and install complete displays for offices, galleries,
          and retail spaces. One studio brings every detail together, from the
          first idea to the final placement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <figure className="flex flex-col">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--ds-gray-alpha-400)] lg:aspect-auto lg:min-h-96 lg:flex-1">
            <Image
              src="/images/display-case.png"
              alt="Glass display case showcasing a sculptural object on a raised plinth"
              fill
              sizes="(min-width: 1024px) 456px, (min-width: 961px) calc((100vw - 112px) / 2), (min-width: 401px) calc(100vw - 64px), calc(100vw - 40px)"
              className="object-cover"
            />
          </div>
          <figcaption className="font-editorial mt-4 text-copy-16 italic text-gray-900">
            Framing, cases, and finishing details — considered together.
          </figcaption>
        </figure>

        <ul className="flex flex-col border-t border-[var(--ds-gray-alpha-400)]">
          {SERVICES.map((service) => (
            <li
              key={service.label}
              className="flex flex-col gap-3 border-b border-[var(--ds-gray-alpha-400)] py-6"
            >
              <span className="label-eyebrow text-gray-700">{service.label}</span>
              <h3 className="font-editorial text-heading-24 text-gray-1000">
                {service.title}
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
