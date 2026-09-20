import { lazy, Suspense } from 'react';
import { profile } from './data/profile';
import { SECTIONS } from './data/sections';
import Hero from './components/hero/Hero';
import HeroBackdrop from './components/hero/HeroBackdrop';
import AboutDefense from './components/AboutDefense';
import ExperienceTimeline from './components/ExperienceTimeline';
import Projects from './components/Projects';
import Contact from './components/Contact';
import EasterEgg from './components/EasterEgg';
import ResumeDock from './components/ResumeDock';
import Starfield from './components/Starfield';
import SmoothScroll from './motion/SmoothScroll';
import CustomCursor from './motion/CustomCursor';
import ScrollProgress from './motion/ScrollProgress';
import IntroMark from './motion/IntroMark';
import Reveal, { HeadingReveal } from './motion/Reveal';
import { useActiveSection } from './hooks/useActiveSection';
import { useTraceSections } from './hooks/useTraceSections';
import { ChatOpenProvider, useChatOpen } from './hooks/useChatOpen';
import JsonLd from './components/JsonLd';

const ChatWidget = lazy(() => import('./components/ChatWidget'));
const SkillGalaxy = lazy(() => import('./components/SkillGalaxy'));

function HeaderAsk() {
  const { openChat } = useChatOpen();
  return (
    <button type="button" className="header-ask chat-ask-fun" onClick={openChat} data-cursor="Ask">
      Ask about me
    </button>
  );
}

export default function App() {
  return (
    <ChatOpenProvider>
      <AppShell />
    </ChatOpenProvider>
  );
}

function AppShell() {
  const active = useActiveSection();
  useTraceSections();

  return (
    <SmoothScroll>
      <JsonLd />
      <Starfield />
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
          <div className="nav-end">
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
            </div>
            <div className="header-actions">
              <ResumeDock />
              <HeaderAsk />
            </div>
          </div>
        </nav>
      </header>

      <main id="main">
        <div className="wrap">
          <div className="hero-about-stage">
            <HeroBackdrop />
            <Hero />

            <section className="block about" id="about" data-accent="magenta">
              <div className="about-copy">
                <HeadingReveal>
                  <h2>About</h2>
                </HeadingReveal>
                {profile.about.map((p, i) => (
                  <Reveal key={p} delay={i * 0.08}>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
              <AboutDefense />
            </section>
          </div>

          <ExperienceTimeline />
          <Projects />

          <section className="block skills-stage" id="skills" data-accent="violet">
            <HeadingReveal>
              <h2>Skills</h2>
            </HeadingReveal>
            <Suspense fallback={null}>
              <SkillGalaxy />
            </Suspense>
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
