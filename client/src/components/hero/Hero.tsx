import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../../data/profile';
import Magnetic from '../../motion/Magnetic';
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { HERO_VARIANT } from './variant';

const HeroNetwork = lazy(() => import('./HeroNetwork'));

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
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    if (reduced || HERO_VARIANT !== 'network') return undefined;
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return undefined;
    }

    const id = window.setTimeout(() => setWebgl(true), 180);
    return () => window.clearTimeout(id);
  }, [reduced]);

  return (
    <section className="hero" id="top">
      {webgl && fine ? (
        <Suspense fallback={null}>
          <HeroNetwork />
        </Suspense>
      ) : (
        <div className="hero-network hero-network-static" aria-hidden="true" />
      )}
      <div className="hero-copy">
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
        <div className="cta-row">
          {profile.resumes.map((r) => (
            <Magnetic key={r.href}>
              <a className="btn btn-cyan" href={r.href} download data-cursor="Save">
                Download {r.label}
              </a>
            </Magnetic>
          ))}
          <Magnetic>
            <a className="btn btn-magenta" href="#chat" data-cursor="Ask">
              Ask about me
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
