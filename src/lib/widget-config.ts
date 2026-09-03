import { z } from 'zod'

export const widgetConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'midnight', 'warm', 'custom']).default('light'),
  layout: z.enum(['badge', 'card', 'carousel', 'minimal', 'floating_button']).default('card'),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color').default('#f97316'),
  backgroundColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  borderRadius: z.number().min(0).max(32).default(12),
  showStars: z.boolean().default(true),
  showReviewCount: z.boolean().default(true),
  showNPS: z.boolean().default(false),
  showRecentReviews: z.boolean().default(true),
  maxReviewsDisplayed: z.number().int().min(1).max(20).default(5),
  promptTitle: z.string().max(100).default('Rate your experience'),
  promptSubtitle: z.string().max(200).default('We value your honest feedback!'),
  redirectUrlOnSubmit: z.string().url().optional().or(z.literal('')),
  collectEmail: z.boolean().default(true),
  requireComments: z.boolean().default(false),
})

export type WidgetConfig = z.infer<typeof widgetConfigSchema>

export const defaultWidgetConfig: WidgetConfig = {
  theme: 'light',
  layout: 'card',
  primaryColor: '#f97316',
  borderRadius: 12,
  showStars: true,
  showReviewCount: true,
  showNPS: false,
  showRecentReviews: true,
  maxReviewsDisplayed: 5,
  promptTitle: 'Rate your experience',
  promptSubtitle: 'We value your honest feedback!',
  collectEmail: true,
  requireComments: false,
}

/**
 * Sanitizes user input text to prevent XSS in widget embeds.
 */
export function sanitizeWidgetInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Generates widget inline CSS variables based on configuration.
 */
export function generateWidgetThemeStyles(config: Partial<WidgetConfig>): Record<string, string> {
  const theme = config.theme || 'light'
  const primary = config.primaryColor || '#f97316'
  const radius = `${config.borderRadius ?? 12}px`

  let bg = '#ffffff'
  let text = '#18181b'
  let cardBg = '#f4f4f5'
  let border = '#e4e4e7'

  if (theme === 'dark') {
    bg = '#18181b'
    text = '#fafafa'
    cardBg = '#27272a'
    border = '#3f3f46'
  } else if (theme === 'midnight') {
    bg = '#09090b'
    text = '#ffffff'
    cardBg = '#141416'
    border = '#27272a'
  } else if (theme === 'warm') {
    bg = '#faf7f2'
    text = '#292524'
    cardBg = '#f5ede2'
    border = '#e7ded4'
  }

  if (config.backgroundColor) bg = config.backgroundColor
  if (config.textColor) text = config.textColor

  return {
    '--rp-primary': primary,
    '--rp-bg': bg,
    '--rp-text': text,
    '--rp-card-bg': cardBg,
    '--rp-border': border,
    '--rp-radius': radius,
  }
}
