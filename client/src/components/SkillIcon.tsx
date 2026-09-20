import type { SimpleIcon } from 'simple-icons';
import {
  siDjango,
  siDocker,
  siExpo,
  siExpress,
  siFirebase,
  siGithub,
  siHtml5,
  siMongodb,
  siMysql,
  siN8n,
  siNodedotjs,
  siPostman,
  siPython,
  siRazorpay,
  siReact,
  siSequelize,
} from 'simple-icons';
import {
  BadgeCheck,
  Cloud,
  Gauge,
  GitBranch,
  KeyRound,
  Layers,
  Network,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Webhook,
  Workflow,
} from 'lucide-react';

const BRAND: Record<string, SimpleIcon> = {
  nodedotjs: siNodedotjs,
  express: siExpress,
  django: siDjango,
  python: siPython,
  mongodb: siMongodb,
  mysql: siMysql,
  sequelize: siSequelize,
  n8n: siN8n,
  docker: siDocker,
  github: siGithub,
  react: siReact,
  expo: siExpo,
  firebase: siFirebase,
  html5: siHtml5,
  postman: siPostman,
  razorpay: siRazorpay,
};

const LUCIDE: Record<string, typeof Network> = {
  network: Network,
  sparkles: Sparkles,
  'git-branch': GitBranch,
  layers: Layers,
  'key-round': KeyRound,
  shield: Shield,
  'shield-check': ShieldCheck,
  gauge: Gauge,
  workflow: Workflow,
  terminal: Terminal,
  cloud: Cloud,
  'badge-check': BadgeCheck,
  webhook: Webhook,
};

export default function SkillIcon({
  icon,
  size = 18,
  className,
}: {
  icon?: string;
  size?: number;
  className?: string;
}) {
  if (!icon) return null;

  if (icon.startsWith('lucide:')) {
    const Lucide = LUCIDE[icon.slice(7)];
    if (!Lucide) return null;
    return <Lucide size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
  }

  const brand = BRAND[icon];
  if (!brand) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d={brand.path} />
    </svg>
  );
}
