export type TiresAiCopyField =
  | 'title'
  | 'subtitle'
  | 'short_description'
  | 'long_description'
  | 'seo_slug'
  | 'seo_title'
  | 'seo_description';

export type TiresAiGenerationState =
  | TiresAiCopyField
  | 'all_fields';

export const TIRES_CONTENT_AI_FIELDS: TiresAiCopyField[] = [
  'title',
  'subtitle',
  'short_description',
  'long_description',
];

export const TIRES_SEO_AI_FIELDS: TiresAiCopyField[] = [
  'seo_slug',
  'seo_title',
  'seo_description',
];
