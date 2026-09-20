import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { flagship, otherProjects } from '../data/profile';
import ArchitectureFlow from './ArchitectureFlow';
import Reveal, { HeadingReveal } from '../motion/Reveal';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type OpenId = 'flagship' | (typeof otherProjects)[number]['name'] | null;

export default function Projects() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<OpenId>(null);
  const ease = [0.22, 1, 0.36, 1] as const;

  const extra = otherProjects.find((p) => p.name === open);

  return (
    <section className="block" id="projects" data-accent="amber">
      <HeadingReveal>
        <h2>Projects</h2>
      </HeadingReveal>
      <motion.article
        className="case"
        layoutId={reduced ? undefined : 'project-flagship'}
        onClick={() => setOpen('flagship')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen('flagship');
          }
        }}
        role="button"
        tabIndex={0}
        data-cursor="View"
      >
        <p className="status">{flagship.status}</p>
        <h3>{flagship.name}</h3>
        <p className="stack">{flagship.stack}</p>
        <ArchitectureFlow />
        <div className="case-grid">
          <div>
            <h4>Problem</h4>
            <p>{flagship.problem}</p>
          </div>
          <div>
            <h4>Outcome</h4>
            <p>{flagship.outcome}</p>
          </div>
        </div>
      </motion.article>

      <div className="cards">
        {otherProjects.map((p, i) => (
          <Reveal key={p.name} delay={Math.min(i * 0.04, 0.2)}>
            <motion.article
              className="card card-lift"
              layoutId={reduced ? undefined : `project-${p.name}`}
              role="button"
              tabIndex={0}
              data-cursor="View"
              onClick={() => setOpen(p.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen(p.name);
                }
              }}
            >
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="project-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.35, ease }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="project-modal-card"
              layoutId={
                reduced ? undefined : open === 'flagship' ? 'project-flagship' : `project-${open}`
              }
              transition={{ duration: reduced ? 0.01 : 0.4, ease }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
            >
              <button type="button" className="chat-close" onClick={() => setOpen(null)}>
                Close
              </button>
              {open === 'flagship' ? (
                <>
                  <p className="status">{flagship.status}</p>
                  <h3 id="project-modal-title">{flagship.name}</h3>
                  <p className="stack">{flagship.stack}</p>
                  <div className="case-grid">
                    <div>
                      <h4>Architecture</h4>
                      <p>{flagship.architecture}</p>
                    </div>
                    <div>
                      <h4>Payments</h4>
                      <p>{flagship.payments}</p>
                    </div>
                    <div>
                      <h4>LLM features</h4>
                      <p>{flagship.llm}</p>
                    </div>
                    <div>
                      <h4>Outcome</h4>
                      <p>{flagship.outcome}</p>
                    </div>
                  </div>
                </>
              ) : extra ? (
                <>
                  <h3 id="project-modal-title">{extra.name}</h3>
                  <p>{extra.blurb}</p>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
