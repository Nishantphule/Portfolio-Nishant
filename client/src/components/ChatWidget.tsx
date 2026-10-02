import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { suggestedQuestions, whatsappHref } from '../data/profile';
import { useChatOpen } from '../hooks/useChatOpen';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string; error?: boolean; stream?: boolean };

const apiBase = import.meta.env.VITE_API_URL ?? '';

const LINK_RE =
  /(https?:\/\/[^\s<>"'`]+|mailto:[^\s<>"'`]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|www\.[^\s<>"'`]+)/gi;

function trimUrl(raw: string) {
  return raw.replace(/[),.;!?]+$/g, '');
}

function hrefFor(raw: string) {
  const token = trimUrl(raw);
  if (/^mailto:/i.test(token) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(token)) {
    return `mailto:${token.replace(/^mailto:/i, '')}`;
  }
  const candidate = /^www\./i.test(token) ? `https://${token}` : token;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function linkify(text: string) {
  const parts: (string | { href: string; label: string })[] = [];
  let last = 0;
  const re = new RegExp(LINK_RE.source, 'gi');
  for (const match of text.matchAll(re)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    const href = hrefFor(raw);
    const core = trimUrl(raw);
    const tail = raw.slice(core.length);
    if (href) {
      parts.push({ href, label: core });
      if (tail) parts.push(tail);
    } else parts.push(raw);
    last = start + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function wantsMessaging(q: string) {
  return /\b(sms|whats?app|imessage)\b|text (him|me|you|nishant)|send (him |a |me )?text|message (him|me|you|nishant)|how (do i |to )?(text|sms|message|contact)|reach .{0,24}(phone|whatsapp|sms)|call (him|you|nishant)/i.test(
    q,
  );
}

function withWhatsAppLink(userText: string, reply: string) {
  if (!wantsMessaging(userText) || /wa\.me\//i.test(reply)) return reply;
  return `${reply.trim()}\n${whatsappHref()}`;
}

function StreamBody({ text, animate }: { text: string; animate: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced || !animate ? text : '');

  useEffect(() => {
    if (reduced || !animate) {
      setShown(text);
      return undefined;
    }
    setShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 8;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 10);
    return () => window.clearInterval(id);
  }, [text, animate, reduced]);

  return (
    <>
      {linkify(shown).map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <a
            key={`${part.href}-${i}`}
            href={part.href}
            target={part.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={part.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            onClick={(e) => e.stopPropagation()}
          >
            {part.label}
          </a>
        ),
      )}
    </>
  );
}

export default function ChatWidget() {
  const reduced = usePrefersReducedMotion();
  const { open, setOpen } = useChatOpen();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask about Nishant’s backend work, the project-management product, or whether he fits an AI-focused role. I only use his resume facts — I will not invent claims.',
    },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return undefined;

    function pathHas(e: Event, className: string) {
      return e.composedPath().some((n) => n instanceof Element && n.classList.contains(className));
    }

    function onPointerDown(e: Event) {
      if (pathHas(e, 'chat-panel') || pathHas(e, 'header-ask')) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setPending(true);

    try {
      const history = next
        .filter((m) => !m.error)
        .map(({ role, content: body }) => ({ role, content: body }));

      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const raw = data?.reply || 'No reply.';
      const userText = next[next.length - 1]?.content ?? content;
      setMessages([...next, { role: 'assistant', content: withWhatsAppLink(userText, raw), stream: true }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reach the chat service.';
      setMessages([...next, { role: 'assistant', content: msg, error: true }]);
    } finally {
      setPending(false);
    }
  }

  const ease = [0.22, 1, 0.36, 1] as const;

  const ui = (
    <div
      className={`chat-root${open ? ' is-open' : ''}`}
      ref={rootRef}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            className="chat-panel"
            role="dialog"
            aria-label="Ask about Nishant"
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduced ? 0.01 : 0.32, ease }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <div className="term-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <h2>ask@nishant:~$</h2>
                <p>Answers from resume facts only. Notice period is not on file yet.</p>
              </div>
              <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
                Close
              </button>
            </header>
            <div className="chat-log" ref={logRef} data-lenis-prevent>
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role}${m.error ? ' error' : ''}`}>
                  {m.role === 'assistant' && !m.error ? (
                    <span className="term-prefix" aria-hidden="true">
                      ›
                    </span>
                  ) : null}
                  <StreamBody text={m.content} animate={Boolean(m.stream) && i === messages.length - 1} />
                </div>
              ))}
              {pending ? <div className="bubble assistant">Thinking…</div> : null}
            </div>
            <div className="chips-row">
              {suggestedQuestions.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} disabled={pending}>
                  {q}
                </button>
              ))}
            </div>
            <form
              className={`chat-form${input ? ' has-value' : ''}`}
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <span className="term-prompt" aria-hidden="true">
                ›
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ask a question"
                aria-label="Your question"
                disabled={pending}
              />
              <span className="term-caret" aria-hidden="true">
                █
              </span>
              <button type="submit" disabled={pending || !input.trim()}>
                send
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!open ? (
        <button
          type="button"
          className="chat-toggle chat-toggle-pulse chat-ask-fun"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          data-cursor="Ask"
        >
          Ask about me
        </button>
      ) : null}
    </div>
  );

  return createPortal(ui, document.body);
}
