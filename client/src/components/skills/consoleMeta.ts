import type { SkillCategory } from '../../data/profile';

export const CATEGORY_METHOD: Record<SkillCategory, string> = {
  backend: 'GET',
  ai: 'POST',
  security: 'AUTH',
  cloud: 'EXEC',
  frontend: 'GET',
  payments: 'POST',
};

export function skillSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function skillPath(name: string) {
  return `/skills/${skillSlug(name)}`;
}

/** Stable cosmetic latency from the skill name — not a real measurement. */
export function skillLatency(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return 38 + (hash % 143);
}
