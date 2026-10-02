import { useEffect, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { registerScroller } from '../lib/smoothScroll';

const EDGE = 1;

function paneCanScroll(el: HTMLElement, deltaY: number, deltaX: number) {
  const { overflowX, overflowY } = getComputedStyle(el);
  const yOk = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + EDGE;
  const xOk = (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + EDGE;

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    if (!yOk) return false;
    if (deltaY < 0 && el.scrollTop <= EDGE) return false;
    if (deltaY > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE) return false;
    return true;
  }
  if (!xOk) return false;
  if (deltaX < 0 && el.scrollLeft <= EDGE) return false;
  if (deltaX > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE) return false;
  return true;
}

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

      let lastDeltaY = 0;
      let lastDeltaX = 0;
      let touchY = 0;
      let touchX = 0;

      const onWheel = (e: WheelEvent) => {
        lastDeltaY = e.deltaY;
        lastDeltaX = e.deltaX;
      };
      const onTouchStart = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        touchY = t.clientY;
        touchX = t.clientX;
      };
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        lastDeltaY = touchY - t.clientY;
        lastDeltaX = touchX - t.clientX;
        touchY = t.clientY;
        touchX = t.clientX;
      };

      window.addEventListener('wheel', onWheel, { capture: true, passive: true });
      window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
      window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });

      const lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        prevent: (node: HTMLElement) => {
          const pane = node.closest('[data-lenis-prevent]');
          if (!(pane instanceof HTMLElement)) return false;
          return paneCanScroll(pane, lastDeltaY, lastDeltaX);
        },
      });
      registerScroller(lenis);

      lenis.on('scroll', ScrollTrigger.update);

      const tickerFn = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      destroy = () => {
        window.removeEventListener('wheel', onWheel, true);
        window.removeEventListener('touchstart', onTouchStart, true);
        window.removeEventListener('touchmove', onTouchMove, true);
        gsap.ticker.remove(tickerFn);
        registerScroller(null);
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
