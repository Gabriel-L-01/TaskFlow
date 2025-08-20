'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import type { Element } from 'hast';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
  onCheckboxToggle?: (line: number) => void;
}

export function MarkdownDisplay({ content, className, onCheckboxToggle }: MarkdownDisplayProps) {
  
  const preprocessedContent = content
    .split('\n')
    .map(line => {
      // Convert custom [ ] and [x] to GFM task list items if they are at the start of a line
      if (line.trim().startsWith('[ ]')) {
        return line.replace('[ ]', '- [ ]');
      }
      if (line.trim().startsWith('[x]')) {
        return line.replace('[x]', '- [x]');
      }
      return line;
    })
    .join('\n');

  return (
    <ReactMarkdown
      className={cn('markdown', className)}
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
        h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold" />,
        h2: ({node, ...props}) => <h2 {...props} className="text-xl font-semibold" />,
        h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold" />,
        li: ({node, children, ...props}) => {
            const isTaskItem = (node?.children[0] as Element)?.tagName === 'input';
            return <li {...props} className={cn(isTaskItem && "list-none ml-[-1.6rem]")}>{children}</li>
        },
        input: ({node, checked, ...props}) => {
          if (props.type === 'checkbox' && props.disabled) {
            const line = node?.position?.start.line;
            return (
              <Checkbox 
                className='mr-2'
                checked={checked}
                onClick={(e) => {
                  e.stopPropagation();
                  if(line !== undefined && onCheckboxToggle) {
                    onCheckboxToggle(line - 1);
                  }
                }}
              />
            )
          }
          return <input {...props} />
        }
      }}
    >
      {preprocessedContent}
    </ReactMarkdown>
  );
}
