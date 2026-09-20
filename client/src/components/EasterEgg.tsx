import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export default function EasterEgg() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let clicks = 0;
    let clickTimer = 0;
    let seq = 0;

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[seq]) {
        seq += 1;
        if (seq === KONAMI.length) {
          seq = 0;
          setOpen(true);
        }
      } else {
        seq = key === KONAMI[0] ? 1 : 0;
      }
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.('.brand')) return;
      clicks += 1;
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => {
        clicks = 0;
      }, 1400);
      if (clicks >= 5) {
        clicks = 0;
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
      window.clearTimeout(clickTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="egg-overlay"
          role="dialog"
          aria-label="whoami"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setOpen(false)}
        >
          <motion.pre
            className="egg-term"
            initial={reduced ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="egg-close" onClick={() => setOpen(false)}>
              close
            </button>
            <span className="egg-prompt">$ whoami</span>
            {'\n'}
            nishant-phule  backend+ai
            {'\n\n'}
            <span className="egg-prompt">$ cat ./fun-fact.txt</span>
            {'\n'}
            This site's chat widget talks to an OpenRouter-proxied LLM
            {'\n'}
            from a Node server so the API key never sits in the browser.
            {'\n'}
            Try asking it about the project-management tool.
            {'\n\n'}
            <span className="egg-ok">$ _</span>
          </motion.pre>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
