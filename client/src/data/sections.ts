export const SECTIONS = [
  { id: 'top', label: 'Hero', accent: 'cyan' },
  { id: 'about', label: 'About', accent: 'magenta' },
  { id: 'experience', label: 'Experience', accent: 'lime' },
  { id: 'projects', label: 'Projects', accent: 'amber' },
  { id: 'skills', label: 'Skills', accent: 'violet' },
  { id: 'contact', label: 'Contact', accent: 'magenta' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
