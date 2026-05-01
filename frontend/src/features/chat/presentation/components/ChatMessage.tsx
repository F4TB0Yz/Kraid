import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { Message, MessagePart } from '../../domain/entities/Message';
import { KraidIcon, CopyIcon, CheckIcon, EditIcon, RefreshCwIcon, GitForkIcon } from '../../../../core/presentation/components/icons';
import { useStreamingText } from '../hooks/useStreamingText';
import { useMessageStream } from '../hooks/useMessageStream';
import { useChatStore } from '../store/chatStore';
import { useToastStore } from '../../../../core/presentation/store/toastStore';
import { useCanvasStore } from '../../../canvas/presentation/store/canvasStore';
import { ToolCallBlock } from './parts/ToolCallBlock';
import { ThinkingBlock } from './parts/ThinkingBlock';
import { CitationChip } from './parts/CitationChip';

interface ChatMessageProps {
  message: Message;
}

interface CodeBlockProps {
  language: string;
  children: string;
}

const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-warm-sand px-4 py-1.5 text-xs font-medium text-olive-gray">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 transition-colors hover:text-charcoal-warm"
        >
          {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={materialLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, background: 'transparent', fontSize: '0.85rem' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !String(children).includes('\n');

    if (!isInline) {
      return (
        <CodeBlock language={match?.[1] || ''}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

const PartRenderer = ({ part }: { part: MessagePart }) => {
  switch (part.type) {
    case 'tool_call':
      return <ToolCallBlock tool={part.tool} input={part.input} status={part.status} output={part.output} />;
    case 'thinking':
      return <ThinkingBlock content={part.content} duration={part.duration} />;
    case 'citation':
      return <CitationChip source={part.source} text={part.text} number={part.number} />;
    case 'text':
      return (
        <div className="prose prose-sm max-w-none text-charcoal-warm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {part.content}
          </ReactMarkdown>
        </div>
      );
  }
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const { isStreaming: storeIsStreaming, streamingMessageId, completeStreaming } = useChatStore();
  const { addToast } = useToastStore();
  const { updateContent } = useCanvasStore();

  const isThisMessageStreaming = storeIsStreaming && streamingMessageId === message.id;

  const { parts: streamParts, isStreaming: isPartStreaming } = useMessageStream(message.id);

  const { displayedText } = useStreamingText(message.content, {
    enabled: isThisMessageStreaming && !isPartStreaming,
    onComplete: () => {
      if (isThisMessageStreaming) {
        completeStreaming();
      }
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    addToast('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToCanvas = async () => {
    await updateContent(message.content);
    setSent(true);
    addToast('Added to canvas');
    setTimeout(() => setSent(false), 2000);
  };

  const handleRegenerate = () => {
    addToast('Regenerate coming soon', 'info');
  };

  const handleFork = () => {
    addToast('Fork coming soon', 'info');
  };

  const time = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasParts = isPartStreaming || (message.parts && message.parts.length > 0);
  const displayParts = isPartStreaming ? streamParts : (message.parts ?? []);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-message-slide-up">
        <div className="group relative max-w-[85%]">
          <div className="rounded-2xl bg-parchment px-4 py-2.5 ring-1 ring-ring-subtle">
            <p className="text-sm leading-relaxed text-charcoal">{message.content}</p>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs text-warm-silver">{time}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
            >
              {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group animate-message-slide-up">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-ivory">
          <KraidIcon className="h-3 w-3" />
        </div>
        <span className="text-xs font-medium text-charcoal-warm">Kraid</span>
        <span className="text-xs text-warm-silver">{time}</span>
      </div>

      {hasParts ? (
        <div className="mt-1.5 flex flex-col gap-1">
          {displayParts.map((part, index) => (
            <PartRenderer key={`${part.type}-${index}`} part={part} />
          ))}
          {isPartStreaming && (
            <span className="inline-block h-4 w-2 animate-caret-blink bg-charcoal" />
          )}
        </div>
      ) : (
        <div className="prose prose-sm mt-1.5 max-w-none text-charcoal-warm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayedText}
          </ReactMarkdown>
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
        >
          {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        {!isThisMessageStreaming && (
          <>
            <button
              onClick={handleSendToCanvas}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
            >
              <EditIcon className="h-3 w-3" />
              {sent ? 'Sent' : 'Canvas'}
            </button>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
            >
              <RefreshCwIcon className="h-3 w-3" />
              Regenerate
            </button>
            <button
              onClick={handleFork}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
            >
              <GitForkIcon className="h-3 w-3" />
              Fork
            </button>
          </>
        )}
      </div>
    </div>
  );
};
