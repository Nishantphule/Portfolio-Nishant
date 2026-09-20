import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/profile';
import Magnetic from '../motion/Magnetic';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const ease = [0.22, 1, 0.36, 1] as const;

export default function ResumeDock() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);

  const expanded = open;

  return (
    <div
      className={`resume-dock${expanded ? ' is-open' : ''}`}
      onMouseEnter={() => {
        if (fine) setOpen(true);
      }}
      onMouseLeave={() => {
        if (fine) setOpen(false);
      }}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="resume-dock-trigger"
        aria-expanded={expanded}
        aria-haspopup="true"
        data-cursor="Save"
        onClick={() => {
          if (!fine) setOpen((v) => !v);
        }}
      >
        <span className="resume-dock-label">Download resume</span>
        <span className="resume-dock-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      <AnimatePresence>
        {expanded ? (
          <motion.div
            className="resume-dock-fan"
            role="menu"
            aria-label="Resume downloads"
            initial={reduced ? false : { opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: reduced ? 0.01 : 0.28, ease }}
          >
            {profile.resumes.map((r, i) => (
              <motion.div
                key={r.href}
                initial={reduced ? false : { opacity: 0, x: 10, rotate: 4 }}
                animate={{ opacity: 1, x: 0, rotate: i === 0 ? -2 : 2 }}
                transition={{ duration: reduced ? 0.01 : 0.32, delay: reduced ? 0 : 0.04 + i * 0.06, ease }}
              >
                <Magnetic>
                  <a
                    className="resume-dock-link"
                    href={r.href}
                    download
                    role="menuitem"
                    data-cursor="Save"
                    onClick={() => setOpen(false)}
                  >
                    <span className="resume-dock-arrow" aria-hidden="true">
                      ↓
                    </span>
                    {r.label}
                  </a>
                </Magnetic>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
