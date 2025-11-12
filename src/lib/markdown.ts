import { marked } from 'marked'

marked.setOptions({
  breaks: true
})

export const renderMarkdown = (content: string) => marked.parse(content) as string
