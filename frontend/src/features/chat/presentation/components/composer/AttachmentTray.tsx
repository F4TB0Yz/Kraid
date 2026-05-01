import { CloseIcon, FileIcon } from '../../../../../core/presentation/components/icons';

export interface Attachment {
  id: string;
  name: string;
  size: number;
}

interface AttachmentTrayProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AttachmentTray = ({ attachments, onRemove }: AttachmentTrayProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-1.5">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group flex items-center gap-1.5 rounded-lg bg-warm-sand px-2.5 py-1.5 text-xs ring-1 ring-border-warm"
        >
          <FileIcon className="h-3.5 w-3.5 text-olive-gray" />
          <span className="max-w-[120px] truncate text-charcoal-warm">{att.name}</span>
          <span className="text-olive-gray">{formatSize(att.size)}</span>
          <button
            onClick={() => onRemove(att.id)}
            className="ml-0.5 rounded p-0.5 text-olive-gray opacity-0 transition-opacity group-hover:opacity-100 hover:text-error"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
