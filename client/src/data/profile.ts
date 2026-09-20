export const profile = {
  name: 'Nishant Phule',
  role: 'Backend Engineer | AI-focused',
  location: 'Nashik, India',
  email: 'nishantphule12@gmail.com',
  phone: '9960435035',
  linkedin: 'https://linkedin.com/in/nishant-phule-b274ba1b7',
  github: 'https://github.com/Nishantphule',
  oneLiner:
    'I ship production APIs, secure auth, and applied LLM features — not chatbot demos.',
  about: [
    'Backend engineer with 2+ years shipping production APIs, secure auth, and applied LLM features. Promoted to Software Engineer in Dec 2025; currently converting legacy systems to React/Node while building an LLM-powered project-management product. Upskilling in AI engineering with Airtribe since Nov 2025.',
    'I lean backend and AI: multi-tenant APIs, Razorpay webhooks, JWT/httpOnly-cookie auth, OpenRouter workflows with deterministic fallbacks, and n8n backup-management flows. Frontend and mobile are supporting skills, not the pitch.',
  ],
  resumes: [
    { label: '1-page PDF', href: '/Nishant-Phule-Resume-1page.pdf' },
    { label: '2-page PDF', href: '/Nishant-Phule-Resume-2page.pdf' },
  ],
} as const;

const envWhatsapp = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export const whatsapp = {
  e164: envWhatsapp || '919960435035',
  prefill:
    'Hi Nishant, I came across your portfolio and wanted to connect about a role/opportunity.',
};

export function whatsappHref() {
  return `https://wa.me/${whatsapp.e164}?text=${encodeURIComponent(whatsapp.prefill)}`;
}

export const experience = [
  {
    company: 'Four Pillars Infotech India Pvt. Ltd.',
    title: 'Software Engineer',
    location: 'Mumbai',
    dates: 'Dec 2025 – Present',
    bullets: [
      'From Feb 2026, led a small engineering team on a client engagement — sprints, delivery, feature releases.',
      'Core contributor on legacy conversion to React and Node.js — services, UI, and production rollout.',
      'NAD DigiLocker integration for secure document verification and authentication.',
      'n8n flows for backup management and real-time alerting; application security (auth, RBAC, API hardening) and admin work.',
      'Building and shipping the internal Project Management Tool (React, Node, MongoDB, Razorpay, OpenRouter LLMs); used internally and being scoped for launch.',
    ],
  },
  {
    company: 'Four Pillars Infotech India Pvt. Ltd.',
    title: 'Associate Software Engineer',
    location: 'Mumbai',
    dates: 'Jun 2024 – Dec 2025',
    bullets: [
      'Full-stack delivery across MSBTE digital government portal projects (backend first).',
      'Migrated 5 legacy PHP modules to Node.js and Django.',
      'Contributed to a Django admin dashboard (RBAC and analytics) as part of a team.',
    ],
  },
  {
    company: 'Increditex Software Solutions Pvt. Ltd.',
    title: 'Jr. Software Developer',
    location: 'Nashik',
    dates: 'Feb 2024 – May 2024',
    bullets: [
      'Node.js/Express APIs with Sequelize for a matrimony platform.',
      'React (Bootstrap) sports-news frontend; supported deployment and QA.',
    ],
  },
  {
    company: 'Freelance — Self-employed',
    title: 'Web Developer',
    location: 'Nashik',
    dates: 'Nov 2023 – Jan 2024',
    bullets: [
      'Full-stack MERN apps with Razorpay, hosted on AWS.',
      'Direct client work from requirements through production hosting.',
    ],
  },
] as const;

export const flagship = {
  name: 'Project Management Tool',
  status: 'Internal product · being scoped for launch',
  stack: 'React, Node.js/Express 5, TypeScript, MongoDB, Socket.IO, Razorpay, OpenRouter',
  problem:
    'The company needed a real project-management system — not a spreadsheet — with teams, billing, and AI that would not take the API down when a model failed.',
  architecture:
    'Multi-tenant Express API on MongoDB (Organization, Team, Task, User, billing, chat). JWT access plus httpOnly refresh cookies, org-scoped RBAC, Zod validation, Helmet, auth rate limits, Socket.IO for live notifications and presence. Redis is an optional shared cache.',
  payments:
    'Razorpay Standard Checkout: POST /api/billing/checkout creates an order; client confirm plus HMAC-verified webhooks on payment.captured / order.paid. PaymentOrder states created → awaiting_capture → paid/failed. Plans Free / Pro / Pro+ (monthly, yearly, lifetime) with coupons.',
  llm: 'OpenRouter (OpenAI-compatible SDK) with deterministic fallbacks so AI never 500s the API: task generation (title, description, tags), chat-thread summarization and task extraction, an in-thread assistant, suggest-only bug-severity classification, and progress/EM digests.',
  outcome:
    'Shipped and used internally. Also includes real-time org chat, GitHub activity on tasks, LLM-assisted repo security review, nightly Mongo backups, and plan-gated entitlements.',
} as const;

export const otherProjects = [
  {
    name: 'Legacy conversion to React / Node',
    blurb: 'Since Dec 2025: converting legacy modules to React and Node.js — services, UI, and production rollout.',
  },
  {
    name: 'NAD DigiLocker integration',
    blurb: 'Secure document verification and authentication on production government portals.',
  },
  {
    name: 'Legacy PHP modernization',
    blurb: 'Five PHP modules migrated to Node.js and Django (Associate period).',
  },
  {
    name: 'Django admin dashboard',
    blurb: 'Team contribution: role-based access control and analytics views.',
  },
  {
    name: 'Client web + mobile (in progress)',
    blurb: 'React/Node with Firebase and Expo (React Native) for mobile push notifications.',
  },
  {
    name: 'Matrimony platform APIs',
    blurb: 'Node.js, Express, and Sequelize data models and business workflows.',
  },
  {
    name: 'Freelance MERN + Razorpay',
    blurb: 'Full-stack apps with payment integration, hosted on AWS.',
  },
] as const;

export const skillGroups = [
  {
    label: 'Backend',
    items: ['Node.js', 'Express.js', 'Django', 'Python', 'REST APIs', 'MongoDB', 'MySQL', 'Sequelize'],
  },
  {
    label: 'AI / automation',
    items: ['OpenRouter / LLMs', 'n8n agents', 'Prompt + fallback design', 'Embeddings'],
  },
  {
    label: 'Security',
    items: ['JWT / OTP auth', 'RBAC', 'API hardening', 'Rate limiting'],
  },
  {
    label: 'Cloud / DevOps',
    items: ['Docker', 'AWS', 'Git / GitHub', 'CI/CD basics', 'bash / cron', 'Postman'],
  },
  {
    label: 'Frontend / mobile',
    items: ['React', 'React Native', 'Expo', 'Firebase', 'HTML/CSS'],
  },
  {
    label: 'Payments',
    items: ['Razorpay orders', 'Signature verify', 'Webhooks'],
  },
] as const;

export const suggestedQuestions = [
  "What's Nishant's strongest backend project?",
  'Why is he a fit for an AI-focused backend role?',
  "What's his notice period?",
] as const;
