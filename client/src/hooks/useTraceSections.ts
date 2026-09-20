import { useEffect } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export function useTraceSections() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('section.block');
    if (reduced) {
      blocks.forEach((el) => el.classList.add('is-traced'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('is-traced');
        }
      },
      { threshold: 0.14 },
    );
    blocks.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);
}
