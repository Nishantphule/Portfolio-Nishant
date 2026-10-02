import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, ExternalLink } from 'lucide-react';
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

function linkMeta(href: string) {
  const h = href.toLowerCase();
  if (h.includes('wa.me') || h.includes('whatsapp.com')) return { label: 'WhatsApp', kind: 'wa' as const };
  if (h.startsWith('mailto:')) return { label: 'Email', kind: 'mail' as const };
  if (h.includes('github.com')) return { label: 'GitHub', kind: 'gh' as const };
  if (h.includes('linkedin.com')) return { label: 'LinkedIn', kind: 'li' as const };
  return { label: 'Open link', kind: 'ext' as const };
}

function LinkIcon({ kind }: { kind: ReturnType<typeof linkMeta>['kind'] }) {
  if (kind === 'mail') return <Mail size={18} strokeWidth={1.75} aria-hidden="true" />;
  if (kind === 'ext') return <ExternalLink size={18} strokeWidth={1.75} aria-hidden="true" />;
  const d =
    kind === 'wa'
      ? 'M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.25c-.24.68-1.41 1.25-1.95 1.33-.5.07-1.13.1-1.83-.12-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.21-4.98-4.41-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1.01-2.41.26-.28.58-.35.77-.35h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.14.32-.28.5-.14.17-.3.39-.42.52-.14.14-.28.3-.12.58.16.28.7 1.16 1.5 1.88 1.04.93 1.91 1.22 2.19 1.36.28.14.44.12.61-.07.16-.18.7-.82.89-1.1.18-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.46.21.53.32.07.12.07.68-.17 1.36z'
      : kind === 'gh'
        ? 'M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.96-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z'
        : 'M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 7v8.99h-4.56v-8c0-1.9-.03-4.35-2.65-4.35-2.65 0-3.06 2.07-3.06 4.21V24H8.34z';
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={d} />
    </svg>
  );
}

function ChatLink({ href }: { href: string }) {
  const meta = linkMeta(href);
  const external = !href.startsWith('mailto:');
  return (
    <a
      className={`bubble-link bubble-link-${meta.kind}`}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={meta.label}
      onClick={(e) => e.stopPropagation()}
    >
      <LinkIcon kind={meta.kind} />
      <span>{meta.label}</span>
    </a>
  );
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

  const parts = linkify(shown);
  const stillTyping = shown.length < text.length;
  if (stillTyping && parts.length > 0 && typeof parts[parts.length - 1] !== 'string') {
    parts.pop();
  }

  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <ChatLink key={`${part.href}-${i}`} href={part.href} />
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
