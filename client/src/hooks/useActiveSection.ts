import { useEffect, useState } from 'react';
import { SECTIONS, type SectionId } from '../data/sections';

export function useActiveSection() {
  const [active, setActive] = useState<SectionId>('top');

  useEffect(() => {
    const onScroll = () => {
      let current: SectionId = 'top';
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return active;
}
