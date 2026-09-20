import { useEffect, useState } from 'react';
import { SECTIONS } from '../data/sections';
import { useActiveSection } from '../hooks/useActiveSection';

export default function ScrollProgress() {
  const active = useActiveSection();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="scroll-bar" aria-hidden="true">
        <div className="scroll-bar-fill" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <nav className="dot-nav" aria-label="Section">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={active === s.id ? 'is-active' : undefined}
            data-accent={s.accent}
            data-cursor="Go"
          >
            <span className="sr-only">{s.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
