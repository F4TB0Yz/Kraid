import { useMemo } from 'react';

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
}

const COMMANDS: SlashCommandItem[] = [
  { id: 'clear', label: 'clear', description: 'Clear conversation' },
  { id: 'canvas', label: 'canvas', description: 'Open canvas' },
  { id: 'memory', label: 'memory', description: 'Browse memory files' },
  { id: 'model', label: 'model', description: 'Switch AI model' },
  { id: 'help', label: 'help', description: 'Show available commands' },
  { id: 'diff', label: 'diff', description: 'Show diff view' },
];

export function useSlashCommands(value: string, cursorPos: number) {
  return useMemo(() => {
    const beforeCursor = value.slice(0, cursorPos);
    const match = beforeCursor.match(/(?:^|\s)\/(\w*)$/);

    if (!match) {
      return { active: false, query: '', items: [], replaceRange: null as null | { start: number; end: number } };
    }

    const query = match[1].toLowerCase();
    const items = COMMANDS.filter((cmd) => cmd.label.startsWith(query));

    return {
      active: true,
      query,
      items,
      replaceRange: {
        start: match.index! + match[0].indexOf('/'),
        end: cursorPos,
      },
    };
  }, [value, cursorPos]);
}
