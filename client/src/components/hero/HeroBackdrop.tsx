import { lazy, Suspense, useEffect, useState } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { HERO_VARIANT } from './variant';

const HeroNetwork = lazy(() => import('./HeroNetwork'));

export default function HeroBackdrop() {
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

  if (webgl && fine) {
    return (
      <Suspense fallback={null}>
        <HeroNetwork />
      </Suspense>
    );
  }

  return <div className="hero-network hero-network-static" aria-hidden="true" />;
}
