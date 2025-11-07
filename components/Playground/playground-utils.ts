import type { FilesObject } from '@/playgroundRemarkPlugin'

export interface PlaygroundConfig {
  supportTailwind?: boolean
  supportReact?: boolean
  includeResetCSS?: boolean
  includeRootDiv?: boolean
  additionalHead?: string[]
}

// Preset definitions
export interface PlaygroundPreset {
  name: string
  description: string
  config: PlaygroundConfig
}

export const PLAYGROUND_PRESETS = {
  vanilla: {
    name: 'Vanilla JavaScript',
    description: 'Pure HTML, CSS, and JavaScript',
    config: {
      supportTailwind: false,
      supportReact: false,
      includeResetCSS: true,
      includeRootDiv: true,
      additionalHead: [] as string[],
    },
  },
  tailwind: {
    name: 'Tailwind CSS',
    description: 'HTML, CSS, JavaScript with Tailwind CSS',
    config: {
      supportTailwind: true,
      supportReact: false,
      includeResetCSS: true,
      includeRootDiv: false,
      additionalHead: [] as string[],
    },
  },
  react: {
    name: 'React',
    description: 'React with JSX/TSX support and Tailwind CSS',
    config: {
      supportTailwind: true,
      supportReact: true,
      includeResetCSS: true,
      includeRootDiv: true,
      additionalHead: [] as string[],
    },
  },
  'react-minimal': {
    name: 'React Minimal',
    description: 'React with JSX/TSX support, no additional styling',
    config: {
      supportTailwind: false,
      supportReact: true,
      includeResetCSS: true,
      includeRootDiv: true,
      additionalHead: [] as string[],
    },
  },
  'vanilla-no-reset': {
    name: 'Vanilla (No Reset)',
    description: 'Pure HTML, CSS, and JavaScript without CSS reset',
    config: {
      supportTailwind: false,
      supportReact: false,
      includeResetCSS: false,
      includeRootDiv: false,
      additionalHead: [] as string[],
    },
  },
} as const

export type PlaygroundPresetName = keyof typeof PLAYGROUND_PRESETS


export type BuildOptions = {
  files: FilesObject
  head?: string[]
  htmlAttr?: string
}

// Base HTML template parts
const createBaseHtmlTemplate = (
  css: string,
  additionalHead: string[] = [],
  body: string,
  scripts: string,
  includeResetCSS: boolean = true,
  htmlAttributes: string = ''
) => `
<!DOCTYPE html>
<html ${htmlAttributes}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${
      includeResetCSS
        ? `<style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
      }
    </style>`
        : ''
    }
    <style>${css}</style>
    ${additionalHead.join('\n    ')}
  </head>
  <body>
    ${body}
    ${scripts}
  </body>
</html>
`

// Main playground builder
export class PlaygroundBuilder {
  private config: PlaygroundConfig

  constructor(presetOrConfig?: PlaygroundPresetName | PlaygroundConfig) {
    if (typeof presetOrConfig === 'string') {
      // Use preset
      const preset = PLAYGROUND_PRESETS[presetOrConfig]
      if (!preset) {
        throw new Error(`Unknown preset: ${presetOrConfig}`)
      }
      this.config = { ...preset.config }
    } else if (presetOrConfig) {
      // Use custom config
      this.config = { ...presetOrConfig }
    } else {
      // Default to vanilla preset
      this.config = { ...PLAYGROUND_PRESETS.vanilla.config }
    }
  }

  // Allow config overrides
  withConfig(overrides: Partial<PlaygroundConfig>): PlaygroundBuilder {
    const newBuilder = new PlaygroundBuilder(this.config)
    newBuilder.config = { ...this.config, ...overrides }
    return newBuilder
  }

  // Convenience methods for common modifications
  withTailwind(enabled: boolean = true): PlaygroundBuilder {
    return this.withConfig({ supportTailwind: enabled })
  }

  withReact(enabled: boolean = true): PlaygroundBuilder {
    return this.withConfig({ supportReact: enabled, includeRootDiv: enabled })
  }

  withResetCSS(enabled: boolean = true): PlaygroundBuilder {
    return this.withConfig({ includeResetCSS: enabled })
  }

  withRootDiv(enabled: boolean = true): PlaygroundBuilder {
    return this.withConfig({ includeRootDiv: enabled })
  }

  withAdditionalHead(head: string | string[]): PlaygroundBuilder {
    const headArray = Array.isArray(head) ? head : [head]
    const currentHead = this.config.additionalHead || []
    return this.withConfig({ additionalHead: [...currentHead, ...headArray] })
  }


  async build({ files, head, htmlAttr }: BuildOptions): Promise<string> {
    const {
      supportTailwind = false,
      supportReact = false,
      includeResetCSS = true,
      includeRootDiv = false,
      additionalHead = [],
    } = this.config

    const html = files['/index.html']?.code || ''
    const css = files['/index.css']?.code || files['/styles.css']?.code || ''
    let js = files['/index.js']?.code || ''
    let scalaMainJS = files['/main.js']?.code || ''

    let headContent = [...additionalHead, ...(head || [])]
    let transformedJs = js

    // Add Tailwind support
    if (supportTailwind) {
      headContent.push('<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>')
    }

    // Add React support
    if (supportReact) {
      const swc = require('@swc/core')

      // Transform JSX/TSX code
      if (js) {
        const result = await swc.transform(js, {
          jsc: {
            parser: {
              syntax: 'typescript',
              jsx: true,
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
                importSource: 'react',
              },
            },
          },
          module: {
            type: 'es6',
          },
        })
        transformedJs = result.code
      }

      // Add React import map
      const importMap = `
        <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@19",
              "react-dom": "https://esm.sh/react-dom@19",
              "react-dom/client": "https://esm.sh/react-dom@19/client",
              "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
              "clsx": "https://esm.sh/clsx@2"
            }
          }
        </script>
      `
      headContent.push(importMap)
    }

    const body = `${html}${includeRootDiv ? '<div id="root"></div>' : ''}`
    let scripts = transformedJs ? `<script type="module">${transformedJs}</script>` : ''
    if(scripts === '' && scalaMainJS !== '') {
      scripts = `<script type="module">${scalaMainJS}</script>`
    } 

    return createBaseHtmlTemplate(css, headContent, body, scripts, includeResetCSS, htmlAttr)
  }
}

// Factory functions for easy access
export const createPlaygroundBuilder = (
  presetOrConfig?: PlaygroundPresetName | PlaygroundConfig
): PlaygroundBuilder => {
  return new PlaygroundBuilder(presetOrConfig)
}

// Utility functions
export const buildPlaygroundContent = async (
  files: FilesObject,
  presetOrConfig?: PlaygroundPresetName | PlaygroundConfig
): Promise<string> => {
  const builder = createPlaygroundBuilder(presetOrConfig)
  return await builder.build({ files })
}

export const getPresetConfig = (presetName: PlaygroundPresetName): PlaygroundConfig => {
  const preset = PLAYGROUND_PRESETS[presetName]
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`)
  }
  return { ...preset.config }
}

// Utility to parse files from JSON string
export const parsePlaygroundFiles = (filesJson: string | FilesObject): FilesObject => {
  return typeof filesJson === 'string' ? JSON.parse(filesJson) : filesJson
}
