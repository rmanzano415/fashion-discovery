import { AsymmetricTemplate } from '@/components/SpreadTemplates';

// Page types: asymmetric templates or full-bleed hero
export type PageType =
  | { kind: 'asymmetric'; template: AsymmetricTemplate }
  | { kind: 'fullbleed'; chapterNumber: number };
