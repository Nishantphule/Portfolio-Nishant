import { useEffect, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;

    let destroy = () => {};
    let alive = true;
    document.documentElement.classList.add('lenis-on');

    (async () => {
      const [{ default: Lenis }, { loadGsap }] = await Promise.all([
        import('lenis'),
        import('./loadGsap'),
      ]);
      if (!alive) return;

      const { gsap, ScrollTrigger } = await loadGsap();
      if (!alive) return;

      const lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
      });

      lenis.on('scroll', ScrollTrigger.update);

      const tickerFn = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      destroy = () => {
        gsap.ticker.remove(tickerFn);
        lenis.destroy();
      };
    })();

    return () => {
      alive = false;
      document.documentElement.classList.remove('lenis-on');
      destroy();
    };
  }, [reduced]);

  return children;
}
