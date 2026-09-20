import { lazy, Suspense } from 'react';
import { profile, skillGroups } from './data/profile';
import { SECTIONS } from './data/sections';
import Hero from './components/hero/Hero';
import ExperienceTimeline from './components/ExperienceTimeline';
import Projects from './components/Projects';
import Contact from './components/Contact';
import EasterEgg from './components/EasterEgg';
import SmoothScroll from './motion/SmoothScroll';
import CustomCursor from './motion/CustomCursor';
import ScrollProgress from './motion/ScrollProgress';
import IntroMark from './motion/IntroMark';
import Reveal, { HeadingReveal } from './motion/Reveal';
import { useActiveSection } from './hooks/useActiveSection';

const ChatWidget = lazy(() => import('./components/ChatWidget'));

const SKILL_ACCENT: Record<string, string> = {
  Backend: 'cyan',
  'AI / automation': 'amber',
  Security: 'magenta',
  'Cloud / DevOps': 'violet',
  'Frontend / mobile': 'lime',
  Payments: 'cyan',
};

export default function App() {
  const active = useActiveSection();

  return (
    <SmoothScroll>
      <IntroMark />
      <CustomCursor />
      <ScrollProgress />
      <EasterEgg />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <nav className="nav" aria-label="Primary">
          <a className="brand" href="#top" data-cursor="Top">
            {profile.name}
          </a>
          <div className="nav-links">
            {SECTIONS.filter((s) => s.id !== 'top').map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={active === s.id ? 'is-active' : undefined}
                style={{ ['--nav-accent' as string]: `var(--${s.accent})` }}
              >
                {s.label}
              </a>
            ))}
            <a href="#chat">Chat</a>
          </div>
        </nav>
      </header>

      <main id="main">
        <div className="wrap">
          <Hero />

          <section className="block about" id="about">
            <HeadingReveal>
              <h2>About</h2>
            </HeadingReveal>
            {profile.about.map((p, i) => (
              <Reveal key={p} delay={i * 0.08}>
                <p>{p}</p>
              </Reveal>
            ))}
          </section>

          <ExperienceTimeline />
          <Projects />

          <section className="block" id="skills">
            <HeadingReveal>
              <h2>Skills</h2>
            </HeadingReveal>
            <div className="skills">
              {skillGroups.map((g) => (
                <Reveal key={g.label}>
                  <div className="skill-group" data-accent={SKILL_ACCENT[g.label] || 'cyan'}>
                    <h3>{g.label}</h3>
                    <div className="chips">
                      {g.items.map((item) => (
                        <span className="chip" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <Contact />
        </div>
      </main>

      <footer className="site-footer" id="chat">
        Built as a backend + AI portfolio — print-perfect resume PDFs, static content, OpenRouter chat via a server proxy.
      </footer>

      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </SmoothScroll>
  );
}
