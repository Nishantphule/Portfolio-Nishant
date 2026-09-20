import { lazy, Suspense, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Mail, Send } from 'lucide-react';
import { profile, whatsappHref } from '../data/profile';
import Magnetic from '../motion/Magnetic';
import { HeadingReveal } from '../motion/Reveal';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const ContactBackdrop = lazy(() => import('./ContactBackdrop'));

const apiBase = import.meta.env.VITE_API_URL ?? '';

type FieldErrors = Partial<Record<'name' | 'email' | 'company' | 'message', string>>;
type FormStatus = 'idle' | 'sending' | 'success' | 'error' | 'limited';

function FieldError({
  id,
  message,
  reduced,
}: {
  id: string;
  message?: string;
  reduced: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          id={id}
          className="field-err"
          role="alert"
          initial={reduced ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduced ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.96-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
      />
    </svg>
  );
}

function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 7v8.99h-4.56v-8c0-1.9-.03-4.35-2.65-4.35-2.65 0-3.06 2.07-3.06 4.21V24H8.34z"
      />
    </svg>
  );
}
function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.25c-.24.68-1.41 1.25-1.95 1.33-.5.07-1.13.1-1.83-.12-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.21-4.98-4.41-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1.01-2.41.26-.28.58-.35.77-.35h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.14.32-.28.5-.14.17-.3.39-.42.52-.14.14-.28.3-.12.58.16.28.7 1.16 1.5 1.88 1.04.93 1.91 1.22 2.19 1.36.28.14.44.12.61-.07.16-.18.7-.82.89-1.1.18-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.46.21.53.32.07.12.07.68-.17 1.36z"
      />
    </svg>
  );
}

function TechMarks() {
  return (
    <ul className="tech-marks" aria-label="Stack">
      <li>React</li>
      <li>Node</li>
      <li>MongoDB</li>
    </ul>
  );
}

export default function Contact() {
  const reduced = usePrefersReducedMotion();
  const [status, setStatus] = useState<FormStatus>('idle');
  const [formError, setFormError] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [shake, setShake] = useState(false);
  const [values, setValues] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    website: '',
  });

  const wa = whatsappHref();
  const ease = [0.22, 1, 0.36, 1] as const;

  function set(name: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFields({});
    setStatus('sending');

    try {
      const res = await fetch(`${apiBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          page: window.location.href,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
        fields?: FieldErrors;
      } | null;

      if (res.status === 429) {
        setStatus('limited');
        setFormError(data?.error || 'Too many messages. Try again later.');
        bumpShake();
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setFields(data?.fields || {});
        setFormError(data?.error || 'Could not send. Try WhatsApp instead.');
        bumpShake();
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setFormError('Could not reach the server. Try WhatsApp or email.');
      bumpShake();
    }
  }

  function bumpShake() {
    if (reduced) return;
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  }

  return (
    <section className="block contact-finale" id="contact">
      <div className="contact-grid-fallback" />
      <Suspense fallback={null}>
        <ContactBackdrop />
      </Suspense>

      <HeadingReveal>
        <h2>Contact</h2>
      </HeadingReveal>
      <p className="contact-lead">Two paths — a considered email, or a quick WhatsApp.</p>
      <TechMarks />

      <div className="contact-grid">
        <article className="glass-card contact-mail">
          <div className="glass-head">
            <Mail size={18} aria-hidden="true" />
            <h3>Email me</h3>
          </div>
          <p className="glass-copy">For roles, referrals, or anything that needs a written trail.</p>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="ok"
                className="contact-success"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.4, ease }}
              >
                <motion.div
                  className="plane"
                  initial={reduced ? false : { x: 0, opacity: 1 }}
                  animate={reduced ? undefined : { x: 80, opacity: 0 }}
                  transition={{ duration: 0.7, ease }}
                  aria-hidden="true"
                >
                  <Send size={28} />
                </motion.div>
                <Check className="ok-icon" size={28} aria-hidden="true" />
                <p className="ok-title">Message sent</p>
                <p>I’ll reply within a day or two. Want something faster?</p>
                <a
                  className="btn btn-wa"
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="Chat"
                >
                  <WhatsAppMark /> Chat now on WhatsApp
                </a>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className={shake ? 'contact-form is-shake' : 'contact-form'}
                onSubmit={onSubmit}
                noValidate
                initial={false}
              >
                <label className="float-field">
                  <input
                    name="name"
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder=" "
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    aria-invalid={Boolean(fields.name)}
                    aria-describedby={fields.name ? 'err-name' : undefined}
                  />
                  <span>Name</span>
                </label>
                <FieldError id="err-name" message={fields.name} reduced={reduced} />

                <label className="float-field">
                  <input
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder=" "
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(fields.email)}
                    aria-describedby={fields.email ? 'err-email' : undefined}
                  />
                  <span>Email</span>
                </label>
                <FieldError id="err-email" message={fields.email} reduced={reduced} />

                <label className="float-field">
                  <input
                    name="company"
                    value={values.company}
                    onChange={(e) => set('company', e.target.value)}
                    placeholder=" "
                    autoComplete="organization"
                    maxLength={120}
                    aria-invalid={Boolean(fields.company)}
                    aria-describedby={fields.company ? 'err-company' : undefined}
                  />
                  <span>Company (optional)</span>
                </label>
                <FieldError id="err-company" message={fields.company} reduced={reduced} />

                <label className="float-field is-area">
                  <textarea
                    name="message"
                    value={values.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder=" "
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    aria-invalid={Boolean(fields.message)}
                    aria-describedby={fields.message ? 'err-message' : undefined}
                  />
                  <span>Message</span>
                </label>
                <FieldError id="err-message" message={fields.message} reduced={reduced} />

                <div className="hp" aria-hidden="true">
                  <label>
                    Website
                    <input
                      name="website"
                      value={values.website}
                      onChange={(e) => set('website', e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>
                </div>

                {formError ? (
                  <p className={status === 'limited' ? 'form-err is-limited' : 'form-err'} role="alert">
                    {formError}
                  </p>
                ) : null}

                <Magnetic>
                  <button
                    type="submit"
                    className="btn btn-magenta"
                    disabled={status === 'sending'}
                    data-cursor="Send"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="spin" size={16} aria-hidden="true" /> Sending…
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" /> Send message
                      </>
                    )}
                  </button>
                </Magnetic>
              </motion.form>
            )}
          </AnimatePresence>
        </article>

        <div className="contact-side">
          <article className="glass-card contact-wa">
            <div className="glass-head">
              <WhatsAppMark />
              <h3>Chat on WhatsApp</h3>
            </div>
            <p className="glass-copy">Prefer a quick chat? Message me directly — I’ll see it on my phone.</p>
            <Magnetic>
              <a
                className="btn btn-wa"
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Chat"
                aria-label="Chat with Nishant on WhatsApp"
              >
                Open WhatsApp
              </a>
            </Magnetic>
          </article>

          <article className="glass-card contact-social">
            <h3>Elsewhere</h3>
            <div className="icon-row">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                data-cursor="Open"
              >
                <GithubMark />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                data-cursor="Open"
              >
                <LinkedinMark />
              </a>
              <a href={`mailto:${profile.email}`} aria-label="Email" data-cursor="Mail">
                <Mail size={20} />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
