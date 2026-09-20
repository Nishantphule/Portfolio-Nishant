import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function IntroMark() {
  const reduced = usePrefersReducedMotion();
  const [show, setShow] = useState(!reduced);

  useEffect(() => {
    if (reduced) return undefined;
    const skip = () => setShow(false);
    const t = window.setTimeout(skip, 720);
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="intro-mark"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <span>NP</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
