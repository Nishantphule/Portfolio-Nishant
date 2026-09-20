import { useEffect, useRef } from 'react';
import { experience } from '../data/profile';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { HeadingReveal } from '../motion/Reveal';

export default function ExperienceTimeline() {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current || !fill.current) return undefined;
    let revert: (() => void) | undefined;
    let alive = true;

    (async () => {
      const { gsap, ScrollTrigger } = await import('../motion/loadGsap').then((m) => m.loadGsap());
      if (!alive || !root.current || !fill.current) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          fill.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top 70%',
              end: 'bottom 55%',
              scrub: true,
            },
          },
        );
        gsap.utils.toArray<HTMLElement>('.job-card').forEach((card) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 86%' },
            },
          );
        });
      }, root.current);
      revert = () => {
        ctx.revert();
        ScrollTrigger.refresh();
      };
    })();

    return () => {
      alive = false;
      revert?.();
    };
  }, [reduced]);

  return (
    <section className="block" id="experience" ref={root} data-accent="lime">
      <HeadingReveal>
        <h2>Experience</h2>
      </HeadingReveal>
      <div className="timeline-track">
        <div className="timeline-line" aria-hidden="true">
          <div ref={fill} className="timeline-line-fill" />
        </div>
        {experience.map((job) => {
          const lead = job.title === 'Software Engineer';
          const accent = job.company.includes('Four Pillars')
            ? 'cyan'
            : job.company.includes('Increditex')
              ? 'amber'
              : 'magenta';
          return (
            <article className="job job-card" data-accent={accent} key={`${job.title}-${job.dates}`}>
              <span className="timeline-dot" aria-hidden="true" />
              {lead ? (
                <p className="milestone">
                  <span className="milestone-mark" />
                  Feb 2026 · stepped into team-lead capacity
                </p>
              ) : null}
              <div className="job-head">
                <h3>
                  {job.title} · {job.company}
                </h3>
                <span className="dates">{job.dates}</span>
              </div>
              <p className="meta">{job.location}</p>
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
