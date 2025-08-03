import React from 'react'

interface NotificationContentRendererProps {
  content: string
  className?: string
}

/**
 * Utility function to parse hyperlinks from notification content
 * Converts hyperLink:[text](URL) format to clickable links
 */
export function parseNotificationHyperlinks(content: string): React.ReactNode[] {
  const hyperlinkRegex = /hyperLink:\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match
  let keyCounter = 0

  while ((match = hyperlinkRegex.exec(content)) !== null) {
    // Add text before the hyperlink
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index)
      if(textBefore){
        parts.push(<span key={`text-${keyCounter++}`}>{textBefore}</span>)
      }
    }

    // Add the hyperlink
    const linkText = match[1]
    const linkUrl = match[2]
    
    // Validate URL format
    let validUrl = linkUrl
    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      validUrl = `https://${linkUrl}`
    }

    parts.push(
      <a
        key={`link-${keyCounter++}`}
        href={validUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline font-medium transition-colors"
      >
        {linkText}
      </a>
    )

    lastIndex = hyperlinkRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex)
    if (remainingText) {
      parts.push(<span key={`text-${keyCounter++}`}>{remainingText}</span>)
    }
  }

  return parts.length > 0 ? parts : [<span key="default">{content}</span>]
}

/**
 * Component to render notification content with hyperlink support
 * Use this component anywhere you need to display notification content
 */
export function NotificationContentRenderer({ content, className = "" }: NotificationContentRendererProps) {
  const renderedContent = parseNotificationHyperlinks(content)
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderedContent}
    </div>
  )
}

/**
 * Simple function to check if content contains hyperlinks
 */
export function hasHyperlinks(content: string): boolean {
  const hyperlinkRegex = /hyperLink:\[([^\]]+)\]\(([^)]+)\)/g
  return hyperlinkRegex.test(content)
}

/**
 * Function to extract all hyperlinks from content (useful for validation)
 */
export function extractHyperlinks(content: string): Array<{ text: string; url: string }> {
  const hyperlinkRegex = /hyperLink:\[([^\]]+)\]\(([^)]+)\)/g
  const links: Array<{ text: string; url: string }> = []
  let match

  while ((match = hyperlinkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    })
  }

  return links
}

/**
 * Function to get plain text content without hyperlink markup
 */
export function getPlainTextContent(content: string): string {
  return content.replace(/hyperLink:\[([^\]]+)\]\(([^)]+)\)/g, '$1')
}

export default NotificationContentRenderer