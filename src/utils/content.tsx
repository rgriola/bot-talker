/**
 * Content renderer for markdown-style links and formatting.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import { ReactNode } from 'react';

/**
 * Renders text content with markdown-style formatting support.
 * Handles ***bold italic*** and [link text](url) patterns.
 * 
 * @param content Raw text content to render
 * @returns Array of React nodes with formatted elements
 */
export function renderContentWithLinks(content: string): ReactNode[] {
  const elements: ReactNode[] = [];
  let key = 0;

  // Pattern to match: ***text*** for bold italic, [text](url) for links, and @bot for mentions
  const combinedPattern = /(\*{3}[^*]+\*{3})|(\[[^\]]+\]\([^)]+\))|(@\w+)/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(content)) !== null) {
    // Add text before match as plain span
    if (match.index > lastIndex) {
      elements.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }

    const matched = match[0];

    if (matched.startsWith('***') && matched.endsWith('***')) {
      // Bold italic: ***text*** → <strong style="italic">
      const innerText = matched.slice(3, -3);
      elements.push(
        <strong key={key++} style={{ fontStyle: 'italic', color: '#4a9eff' }}>
          {innerText}
        </strong>
      );
    } else if (matched.startsWith('[')) {
      // Link: [text](url) → <a href>
      const linkMatch = matched.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        elements.push(
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60a5fa',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              cursor: 'pointer',
            }}
          >
            {linkText}
          </a>
        );
      }
    } else if (matched.startsWith('@')) {
      // Mention: @BotName
      const botName = matched.slice(1);
      elements.push(
        <a
          key={key++}
          href={`/bot/${encodeURIComponent(botName)}`}
          style={{
            color: '#fbbf24', // Amber/Yellow for mentions
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {matched}
        </a>
      );
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    elements.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return elements.length > 0 ? elements : [<span key={0}>{content}</span>];
}
