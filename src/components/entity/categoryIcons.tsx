import { ReactNode } from 'react';
import { EntityCategory } from '@/types/entity';

/**
 * SVG icons for each entity category.
 * Use these instead of the emoji constants in `entity.ts` so we control
 * stroke weight, color (currentColor), and sizing consistently.
 */
export const ENTITY_CATEGORY_SVG: Record<EntityCategory, ReactNode> = {
  character: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <circle cx="8" cy="5" r="2.5" />
      <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M2 3.5l4-1.5 4 1.5 4-1.5v10l-4 1.5-4-1.5-4 1.5v-10z" strokeLinejoin="round" />
      <path d="M6 2v11M10 3.5v11" />
    </svg>
  ),
  item: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M11 2l3 3-7.5 7.5L4 13l.5-2.5L11 2z" strokeLinejoin="round" />
      <path d="M9.5 3.5l3 3" />
      <path d="M3 11.5L4.5 13" strokeLinecap="round" />
    </svg>
  ),
  ui: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2 6h12M5 9.5h6" strokeLinecap="round" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M6 2v9.5M6 2l5-1.2v9.5" strokeLinecap="round" />
      <circle cx="4.5" cy="11.5" r="1.5" />
      <circle cx="9.5" cy="10.3" r="1.5" />
    </svg>
  ),
  effect: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M8 1.5L9.5 6l4.5 1-3.5 3 1 4.5L8 12.5 4.5 14.5l1-4.5L2 7l4.5-1L8 1.5z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
};
