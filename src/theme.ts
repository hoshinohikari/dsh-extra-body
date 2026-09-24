export interface ThemeEnvironment {
  bodyBackground?: string
  rootBackground?: string
  textColor?: string
  prefersDark?: boolean
}

export interface Palette {
  group: string
  raised: string
  field: string
  border: string
  divider: string
  text: string
  secondary: string
  accent: string
  accentSoft: string
  accentBorder: string
  danger: string
  dangerBg: string
  dangerBorder: string
  shadow: string
}

function colorParts(color: unknown): number[] | undefined {
  const values = typeof color === 'string' ? color.match(/\d+(?:\.\d+)?/g)?.map(Number) : undefined
  return values !== undefined && values.length >= 3 ? values : undefined
}

function luminance(values: number[]): number {
  return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722
}

/** Transparent body backgrounds must not be interpreted as opaque black. */
export function isDarkTheme({ bodyBackground, rootBackground, textColor, prefersDark }: ThemeEnvironment = {}): boolean {
  for (const color of [bodyBackground, rootBackground]) {
    const values = colorParts(color)
    if (values && (values[3] ?? 1) > 0) return luminance(values) < 145
  }
  const text = colorParts(textColor)
  if (text && (text[3] ?? 1) > 0) return luminance(text) > 145
  return prefersDark === true
}

/** Match the Desktop settings surface, including transparent page backgrounds. */
export function palette(environment?: ThemeEnvironment): Palette {
  let dark = false
  if (environment !== undefined) dark = isDarkTheme(environment)
  else {
    try {
      const body = getComputedStyle(document.body)
      const root = getComputedStyle(document.documentElement)
      dark = isDarkTheme({
        bodyBackground: body.backgroundColor,
        rootBackground: root.backgroundColor,
        textColor: body.color,
        prefersDark: window.matchMedia?.('(prefers-color-scheme: dark)').matches,
      })
    } catch { /* Use the light palette until the page styles are available. */ }
  }
  return dark
    ? {
        group: '#2C2C2E', raised: '#3A3A3C', field: '#2C2C2E',
        border: 'rgba(255,255,255,0.12)', divider: 'rgba(255,255,255,0.10)',
        text: '#F5F5F7', secondary: 'rgba(235,235,245,0.60)', accent: '#0A84FF',
        accentSoft: 'rgba(10,132,255,0.16)', accentBorder: 'rgba(10,132,255,0.42)',
        danger: '#FF453A', dangerBg: 'rgba(255,69,58,0.16)', dangerBorder: 'rgba(255,69,58,0.30)',
        shadow: '0 1px 1px rgba(0,0,0,0.24)',
      }
    : {
        group: '#FFFFFF', raised: '#F9F9FB', field: '#F2F2F7',
        border: 'rgba(60,60,67,0.18)', divider: 'rgba(60,60,67,0.18)',
        text: '#1C1C1E', secondary: '#6D6D72', accent: '#007AFF',
        accentSoft: 'rgba(0,122,255,0.10)', accentBorder: 'rgba(0,122,255,0.32)',
        danger: '#FF3B30', dangerBg: 'rgba(255,59,48,0.12)', dangerBorder: 'rgba(255,59,48,0.28)',
        shadow: '0 1px 1px rgba(0,0,0,0.05)',
      }
}
