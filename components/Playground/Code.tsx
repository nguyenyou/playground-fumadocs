import { highlighter } from './highlighter'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerNotationWordHighlight
} from '@shikijs/transformers'
import { Lang } from './types'

type Props = {
  code: string
  lang: Lang
}


export const Code = ({ code, lang }: Props) => {
  const normalizedCode = (code || '').trim()
  const html = highlighter.codeToHtml(normalizedCode, {
    lang,
    theme: 'github-dark-default',
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
      transformerNotationWordHighlight()
    ]
  })
  return (
    <div
      className="h-full playground-code p-1 bg-card"
      dangerouslySetInnerHTML={{ __html: html }}
    >
    </div>
  )
}
