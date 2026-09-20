import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export const architectureLayers = [
  { id: 'ui', label: 'React client', hint: 'Boards, chat, entitlements' },
  { id: 'api', label: 'Express API', hint: 'JWT, Zod, org RBAC' },
  { id: 'db', label: 'MongoDB', hint: 'Org / team / task' },
  { id: 'llm', label: 'OpenRouter', hint: 'Fail-open LLM layer' },
  { id: 'pay', label: 'Razorpay', hint: 'HMAC webhooks' },
] as const;

export default function ArchitectureFlow() {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current) return undefined;
    let revert: (() => void) | undefined;
    let alive = true;

    (async () => {
      const { gsap } = await import('../motion/loadGsap').then((m) => m.loadGsap());
      if (!alive || !root.current) return;
      const ctx = gsap.context(() => {
        const nodes = gsap.utils.toArray<HTMLElement>('.arch-node');
        const pipes = gsap.utils.toArray<HTMLElement>('.arch-pipe');
        gsap.fromTo(
          nodes,
          { opacity: 0.2, y: 16 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.18,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top 75%',
              end: 'center 50%',
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          pipes,
          { scaleX: 0 },
          {
            scaleX: 1,
            stagger: 0.18,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top 75%',
              end: 'center 50%',
              scrub: true,
            },
          },
        );
      }, root.current);
      revert = () => ctx.revert();
    })();

    return () => {
      alive = false;
      revert?.();
    };
  }, [reduced]);

  return (
    <div className="arch" ref={root} aria-label="System architecture">
      {architectureLayers.map((layer, i) => (
        <div className="arch-item" key={layer.id}>
          <div className={`arch-node arch-node--${layer.id}`}>
            <strong>{layer.label}</strong>
            <span>{layer.hint}</span>
          </div>
          {i < architectureLayers.length - 1 ? <div className="arch-pipe" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}
