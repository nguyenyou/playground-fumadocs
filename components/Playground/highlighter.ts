import { createHighlighter } from 'shiki'

export const highlighter = await createHighlighter({
  themes: ['github-light-default'],
  langs: ['javascript', 'html', 'css', 'jsx', 'tsx', 'ts'],
})
