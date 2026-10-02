import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SKILL_CATEGORY_ORDER,
  SKILL_META,
  skillGroups,
  type Skill,
  type SkillCategory,
} from '../../data/profile';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import SkillIcon from '../SkillIcon';
import { CATEGORY_METHOD, skillLatency, skillPath, skillSlug } from './consoleMeta';

const SEND_MS = 180;
const SEARCH_MS = 100;
const EMPTY_PROOF = 'No additional detail on file.';

const LENIS = {
  'data-lenis-prevent': true,
  'data-lenis-prevent-wheel': true,
  'data-lenis-prevent-touch': true,
} as const;

function CategoryList({
  active,
  searching,
  onSelect,
  variant,
}: {
  active: SkillCategory;
  searching: boolean;
  onSelect: (id: SkillCategory) => void;
  variant: 'sidebar' | 'tabs';
}) {
  return (
    <>
      {skillGroups.map((g) => {
        const selected = !searching && active === g.id;
        return (
          <button
            key={`${variant}-${g.id}`}
            type="button"
            className={`console-cat${selected ? ' is-active' : ''}`}
            data-accent={g.accent}
            aria-pressed={selected}
            onClick={() => onSelect(g.id)}
          >
            <span className="console-cat-dot" aria-hidden="true" />
            <span className="console-cat-label">{g.label}</span>
            <span className="console-cat-count">({g.items.length})</span>
          </button>
        );
      })}
    </>
  );
}

function JsonBody({ skill }: { skill: Skill }) {
  const proof = skill.blurb || EMPTY_PROOF;
  return (
    <pre className="console-json">
      <code>
        {'{\n  '}
        <span className="console-json-key">"skill"</span>
        {': '}
        <span className="console-json-str">{JSON.stringify(skill.name)}</span>
        {',\n  '}
        <span className="console-json-key">"category"</span>
        {': '}
        <span className="console-json-str">{JSON.stringify(skill.category)}</span>
        {',\n  '}
        <span className="console-json-key">"status"</span>
        {': '}
        <span className="console-json-ok">"verified"</span>
        {',\n  '}
        <span className="console-json-key">"proof"</span>
        {': '}
        <span className="console-json-str">{JSON.stringify(proof)}</span>
        {'\n}'}
      </code>
    </pre>
  );
}

function EndpointRow({
  skill,
  open,
  sending,
  onToggle,
  onClose,
}: {
  skill: Skill;
  open: boolean;
  sending: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const meta = SKILL_META[skill.category];
  const method = CATEGORY_METHOD[skill.category];
  const path = skillPath(skill.name);
  const panelId = `skill-res-${skillSlug(skill.name)}`;
  const latency = skillLatency(skill.name);

  return (
    <article
      className={`console-ep${open ? ' is-open' : ''}${sending ? ' is-sending' : ''}`}
      data-accent={meta.accent}
      data-shape={meta.shape}
    >
      <button
        type="button"
        className="console-row"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${method} ${skill.name}, verified`}
        onClick={onToggle}
      >
        <span className="console-method">{method}</span>
        <span className="console-path">{path}</span>
        <span className="console-name">{skill.name}</span>
        <SkillIcon icon={skill.icon} size={16} className="console-icon" />
        <span className="console-send">{open ? 'Close' : 'Send ▸'}</span>
      </button>
      <div className="console-res" id={panelId} role="region" aria-hidden={!open} {...(open ? {} : { inert: true })}>
        <div className="console-res-inner">
          <div className="console-res-bar">
            <span className="console-status-dot" aria-hidden="true" />
            <span className="console-ok">200 OK</span>
            <span className="console-lat">{latency}ms</span>
            <button type="button" className="console-res-close" onClick={onClose} aria-label={`Collapse ${skill.name}`}>
              Close
            </button>
          </div>
          <JsonBody skill={skill} />
        </div>
      </div>
    </article>
  );
}

export default function SkillConsole() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<SkillCategory>(SKILL_CATEGORY_ORDER[0]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [sending, setSending] = useState<Set<string>>(() => new Set());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), SEARCH_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const searching = debounced.trim().length > 0;
  const needle = debounced.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!searching) return skillGroups.filter((g) => g.id === active);
    return skillGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((s) => s.name.toLowerCase().includes(needle)),
      }))
      .filter((g) => g.items.length > 0);
  }, [active, needle, searching]);

  const visibleNames = useMemo(() => visibleGroups.flatMap((g) => g.items.map((s) => s.name)), [visibleGroups]);

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function openNames(names: string[]) {
    if (reduced) {
      setOpen((prev) => {
        const next = new Set(prev);
        names.forEach((n) => next.add(n));
        return next;
      });
      return;
    }
    setSending((prev) => {
      const next = new Set(prev);
      names.forEach((n) => next.add(n));
      return next;
    });
    later(() => {
      setSending((prev) => {
        const next = new Set(prev);
        names.forEach((n) => next.delete(n));
        return next;
      });
      setOpen((prev) => {
        const next = new Set(prev);
        names.forEach((n) => next.add(n));
        return next;
      });
    }, SEND_MS);
  }

  function closeName(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function toggleName(name: string) {
    if (open.has(name)) {
      closeName(name);
      return;
    }
    openNames([name]);
  }

  function selectCategory(id: SkillCategory) {
    setActive(id);
    setQuery('');
    setDebounced('');
  }

  return (
    <div className="console">
      <aside className="console-sidebar" aria-label="Skill collections" {...LENIS}>
        <p className="console-sidebar-kicker">Collections</p>
        <CategoryList active={active} searching={searching} onSelect={selectCategory} variant="sidebar" />
      </aside>

      <div className="console-main">
        <p className="console-comment">// GET /skills — 6 collections</p>

        <nav className="console-tabs" aria-label="Skill collections" {...LENIS}>
          <CategoryList active={active} searching={searching} onSelect={selectCategory} variant="tabs" />
        </nav>

        <label className={`console-search${query ? ' has-value' : ''}${focused ? ' is-focused' : ''}`}>
          <span className="sr-only">Filter skills</span>
          <input
            type="search"
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {!query && !focused ? (
            <span className="console-ph" aria-hidden="true">
              grep skills...
              <span className="console-caret" />
            </span>
          ) : null}
        </label>

        <div className="console-toolbar">
          <button type="button" className="console-send-all" onClick={() => openNames(visibleNames)} disabled={!visibleNames.length}>
            Send all
          </button>
          {searching ? (
            <p className="console-hits">
              {visibleNames.length} match{visibleNames.length === 1 ? '' : 'es'}
            </p>
          ) : null}
        </div>

        <div className="console-list" {...LENIS}>
          {visibleGroups.length === 0 ? (
            <p className="console-empty">// 0 matches</p>
          ) : (
            visibleGroups.map((g) => (
              <section key={g.id} className="console-group" data-accent={g.accent}>
                <h3>{g.label}</h3>
                {g.items.map((s) => (
                  <EndpointRow
                    key={s.name}
                    skill={s}
                    open={open.has(s.name)}
                    sending={sending.has(s.name)}
                    onToggle={() => toggleName(s.name)}
                    onClose={() => closeName(s.name)}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
