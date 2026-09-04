import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ gfm: true, breaks: false })

/**
 * Briefs and notes are authored by the people using this repo and read from
 * local files — trusted content, so it renders as-is. If briefs ever come from
 * somewhere else, this is the place that has to start sanitising.
 */
export function Markdown({ children }: { children: string }) {
  const html = useMemo(() => marked.parse(children) as string, [children])
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
}
