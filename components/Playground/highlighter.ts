import { createHighlighter } from 'shiki'

export const highlighter = await createHighlighter({
  themes: ['github-dark-default'],
  langs: ['javascript', 'html', 'css', 'jsx', 'tsx', 'ts'],
})
