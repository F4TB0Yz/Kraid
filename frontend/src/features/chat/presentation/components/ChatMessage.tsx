import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { Message } from '../../domain/entities/Message';
import { Avatar } from '../../../../core/presentation/components/Avatar';
import { CopyIcon, CheckIcon, EditIcon } from '../../../../core/presentation/components/icons';
import { useStreamingText } from '../hooks/useStreamingText';
import { useChatStore } from '../store/chatStore';
import { useToastStore } from '../../../../core/presentation/store/toastStore';
import { useCanvasStore } from '../../../canvas/presentation/store/canvasStore';

interface ChatMessageProps {
  message: Message;
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !String(children).includes('\n');
    
    return !isInline ? (
      <div className="rounded-lg overflow-hidden border border-border my-4">
        <SyntaxHighlighter
          style={materialLight}
          language={match?.[1] || 'text'}
          PreTag="div"
          customStyle={{ margin: 0, background: 'transparent', fontSize: '0.85rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const { isStreaming: storeIsStreaming, streamingMessageId, completeStreaming } = useChatStore();
  const { addToast } = useToastStore();
  const { updateContent, document } = useCanvasStore();

  const isThisMessageStreaming = storeIsStreaming && streamingMessageId === message.id;

  const { displayedText } = useStreamingText(message.content, {
    enabled: isThisMessageStreaming,
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
    const newContent = document?.content 
      ? `${document.content}\n\n${message.content}`
      : message.content;
    
    await updateContent(newContent);
    setSent(true);
    addToast('Added to canvas');
    setTimeout(() => setSent(false), 2000);
  };

  const time = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-message-slide-up">
        <div className="group relative max-w-[85%]">
          <div className="rounded-2xl bg-warm-sand px-4 py-2.5 ring-1 ring-border-warm">
            <p className="text-sm leading-relaxed text-charcoal">{message.content}</p>
          </div>
          <p className="mt-1 text-right text-xs text-warm-silver opacity-0 transition-opacity group-hover:opacity-100">
            {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3 animate-message-slide-up">
      <Avatar role="assistant" />
      <div className="min-w-0 flex-1">
        <div className="prose prose-sm max-w-none text-charcoal-warm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {isThisMessageStreaming ? displayedText : message.content}
          </ReactMarkdown>
        </div>
        <div className="mt-1.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs text-warm-silver">{time}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
          >
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!isThisMessageStreaming && (
            <button
              onClick={handleSendToCanvas}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-warm-silver transition-colors hover:bg-border-cream hover:text-charcoal-warm"
            >
              {sent ? <CheckIcon className="h-3 w-3" /> : <EditIcon className="h-3 w-3" />}
              {sent ? 'Sent' : 'Send to Canvas'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
