import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../../data/profile';
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%';

function ScrambleKicker({ text }: { text: string }) {
  const reduced = usePrefersReducedMotion();
  const [out, setOut] = useState(reduced ? text : '');

  useEffect(() => {
    if (reduced) {
      setOut(text);
      return undefined;
    }
    const start = performance.now();
    const dur = 500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const locked = Math.floor(p * text.length);
      setOut(
        text
          .split('')
          .map((ch, i) => {
            if (i < locked || /\s|[·|]/.test(ch)) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(''),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, reduced]);

  return <span>{out}</span>;
}

export default function Hero() {
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();

  return (
    <section className="hero" id="top">
      <div className="hero-horizon" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hud-frame" aria-hidden="true">
          <span className="hud-br hud-br-tl" />
          <span className="hud-br hud-br-tr" />
          <span className="hud-br hud-br-bl" />
          <span className="hud-br hud-br-br" />
        </div>
        <ul className="hud-readouts" aria-hidden="true">
          <li>Systems: online</li>
          <li>Role: backend / AI</li>
          <li>Location: {profile.location}</li>
        </ul>
        <motion.p
          className="kicker"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <ScrambleKicker text={profile.role} />
        </motion.p>
        <motion.h1
          className="hero-name"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hero-name-core">{profile.name}</span>
          {fine && !reduced ? (
            <>
              <span className="hero-name-split hero-name-cyan" aria-hidden="true">
                {profile.name}
              </span>
              <span className="hero-name-split hero-name-magenta" aria-hidden="true">
                {profile.name}
              </span>
            </>
          ) : null}
        </motion.h1>
        <p className="role">{profile.location}</p>
        <p className="one-liner">{profile.oneLiner}</p>
      </div>
    </section>
  );
}
