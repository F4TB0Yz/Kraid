import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { SendIcon, PaperclipIcon, MicIcon } from '../../../../core/presentation/components/icons';
import { useSlashCommands } from '../hooks/useSlashCommands';
import { SlashMenu } from './composer/SlashMenu';
import { MentionMenu, type MentionItem } from './composer/MentionMenu';
import { ContextChips } from './composer/ContextChips';
import { AttachmentTray, type Attachment } from './composer/AttachmentTray';
import { useCanvasStore } from '../../../canvas/presentation/store/canvasStore';
import { useMemoryStore } from '../../../memory/presentation/store/memoryStore';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [mode, setMode] = useState<'chat' | 'agent' | 'edit'>('chat');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { documents: canvasDocs, activeDocumentId } = useCanvasStore();
  const canvasDoc = useMemo(() => canvasDocs.find((d) => d.id === activeDocumentId) ?? null, [canvasDocs, activeDocumentId]);
  const { files: memoryFiles } = useMemoryStore();

  const slash = useSlashCommands(value, cursorPos);

  const mentionState = useMemo(() => {
    const beforeCursor = value.slice(0, cursorPos);
    const match = beforeCursor.match(/(?:^|\s)(@(\w*))$/);
    if (match) {
      return {
        active: true,
        query: match[2],
        start: match.index! + match[1].indexOf('@'),
        end: cursorPos,
      };
    }
    return { active: false, query: '', start: 0, end: 0 };
  }, [value, cursorPos]);

  const mentionItems = useMemo(() => {
    const result: MentionItem[] = [];
    if (canvasDoc) {
      result.push({ id: `doc-${canvasDoc.id}`, label: canvasDoc.title, type: 'canvas' });
    }
    for (const f of memoryFiles) {
      result.push({ id: `mem-${f.id}`, label: f.filename, type: 'memory' });
    }
    return result;
  }, [canvasDoc, memoryFiles]);

  const filteredMentionItems = useMemo(() => {
    if (!mentionState.query) return mentionItems;
    const lower = mentionState.query.toLowerCase();
    return mentionItems.filter((item) => item.label.toLowerCase().includes(lower));
  }, [mentionItems, mentionState.query]);

  const showSlashMenu = slash.active && slash.items.length > 0;
  const showMentionMenu = mentionState.active && filteredMentionItems.length > 0;

  const clampedSlashIndex = Math.min(selectedSlashIndex, Math.max(0, slash.items.length - 1));
  const clampedMentionIndex = Math.min(selectedMentionIndex, Math.max(0, filteredMentionItems.length - 1));

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const replaceText = useCallback(
    (start: number, end: number, replacement: string) => {
      const newVal = value.slice(0, start) + replacement + value.slice(end);
      setValue(newVal);
      setCursorPos(start + replacement.length);
      textareaRef.current?.focus();
    },
    [value],
  );

  const handleSlashSelect = useCallback(
    (item: { id: string; label: string }) => {
      if (slash.replaceRange) {
        replaceText(slash.replaceRange.start, slash.replaceRange.end, item.label);
      }
    },
    [replaceText, slash.replaceRange],
  );

  const handleMentionSelect = useCallback(
    (item: MentionItem) => {
      if (mentionState.active) {
        replaceText(mentionState.start, mentionState.end, item.label);
      }
    },
    [replaceText, mentionState],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setCursorPos(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.currentTarget.selectionStart);
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => Math.min(prev + 1, slash.items.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSlashSelect(slash.items[clampedSlashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        return;
      }
    }

    if (showMentionMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.min(prev + 1, filteredMentionItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleMentionSelect(filteredMentionItems[clampedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const charCount = value.length;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="relative rounded-2xl border border-border-warm bg-ivory shadow-sm ring-1 ring-border-cream transition-shadow focus-within:ring-2 focus-within:ring-terracotta/20">
        <ContextChips
          mode={mode}
          contextFiles={attachments.length}
          onModeChange={setMode}
        />

        <SlashMenu
          open={showSlashMenu}
          query={slash.query}
          items={slash.items}
          selectedIndex={clampedSlashIndex}
          onSelect={handleSlashSelect}
          onClose={() => {}}
        />

        <MentionMenu
          open={showMentionMenu}
          items={filteredMentionItems}
          selectedIndex={clampedMentionIndex}
          onSelect={handleMentionSelect}
          onClose={() => {}}
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Message Kraid or type / for commands..."
          disabled={isLoading}
          className="block w-full resize-none bg-transparent px-4 pb-2 pt-1 text-sm leading-relaxed text-charcoal placeholder:text-warm-silver focus:outline-none disabled:opacity-50"
        />

        <AttachmentTray
          attachments={attachments}
          onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        />

        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-warm-silver transition-colors hover:bg-warm-sand hover:text-charcoal-warm"
              aria-label="Attach file"
            >
              <PaperclipIcon className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-warm-silver transition-colors hover:bg-warm-sand hover:text-charcoal-warm"
              aria-label="Voice input"
            >
              <MicIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {charCount > 0 && (
              <span className="text-xs text-warm-silver/70">{charCount}</span>
            )}
            <button
              onClick={() => void handleSubmit()}
              disabled={!value.trim() || isLoading}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta text-ivory transition-colors hover:bg-coral disabled:cursor-not-allowed disabled:opacity-30"
            >
              <SendIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
