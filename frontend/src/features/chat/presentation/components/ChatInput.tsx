import { useRef, useState } from 'react';
import { SendIcon } from '../../../../core/presentation/components/icons';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="rounded-2xl border border-border-warm bg-ivory shadow-sm ring-1 ring-border-cream transition-shadow focus-within:ring-2 focus-within:ring-terracotta/20">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Message Kraid…"
          disabled={isLoading}
          className="block w-full resize-none bg-transparent px-4 pb-2 pt-3 text-sm leading-relaxed text-charcoal placeholder:text-warm-silver focus:outline-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="text-xs text-warm-silver/70">
            {hasContent ? '⌘↵ to send' : ''}
          </span>
          <button
            onClick={() => void handleSubmit()}
            disabled={!hasContent || isLoading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta text-ivory transition-colors hover:bg-coral disabled:cursor-not-allowed disabled:opacity-30"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
