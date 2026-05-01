interface CitationChipProps {
  source: string;
  text: string;
  number: number;
}

export const CitationChip = ({ source, text, number }: CitationChipProps) => {
  return (
    <span
      className="inline-flex cursor-pointer items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent transition-colors hover:bg-accent/20"
      title={`${source}: ${text}`}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-[10px] font-medium">
        {number}
      </span>
      {source}
    </span>
  );
};
