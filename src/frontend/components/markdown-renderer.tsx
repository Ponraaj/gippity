"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface MarkdownRendererProps {
  content: string;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, filename?: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`${filename ? `${filename} ` : ''}copied to clipboard`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard ' + err);
    }
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: CodeComponentProps) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            if (!inline && match) {
              // Extract filename from comment if present
              const lines = code.split('\n');
              const firstLine = lines[0];
              const filename = firstLine.match(/^\/\/ (.+)$|^# (.+)$|^<!-- (.+) -->$/)?.[1] || firstLine.match(/^\/\/ (.+)$|^# (.+)$|^<!-- (.+) -->$/)?.[2] || firstLine.match(/^\/\/ (.+)$|^# (.+)$|^<!-- (.+) -->$/)?.[3];
              
              return (
                <div className="code-block relative my-4">
                  {filename && (
                    <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b">
                      <span className="text-sm font-medium text-muted-foreground">
                        {filename}
                      </span>
                    </div>
                  )}
                  <div className="relative">
                    <SyntaxHighlighter
                      style={theme === 'dark' ? oneDark : oneLight}
                      language={language}
                      PreTag="div"
                      className={`!bg-card !border ${filename ? '!rounded-t-none' : '!rounded-lg'} !mt-0`}
                      {...props}
                    >
                      {filename ? lines.slice(1).join('\n') : code}
                    </SyntaxHighlighter>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="copy-button h-8 w-8 bg-background/80 hover:bg-background border"
                      onClick={() => copyToClipboard(filename ? lines.slice(1).join('\n') : code, filename)}
                    >
                      {copiedCode === (filename ? lines.slice(1).join('\n') : code) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}