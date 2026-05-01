interface DiffLine {
  type: 'add' | 'del' | 'context';
  content: string;
  lineNumber?: number;
}

interface DiffViewProps {
  hunks: DiffLine[];
  title?: string;
}

const LINE_COLORS = {
  add: 'bg-green-50 text-green-800 border-l-2 border-green-500',
  del: 'bg-red-50 text-red-700 border-l-2 border-red-400',
  context: 'text-charcoal-warm border-l-2 border-transparent',
};

const LINE_PREFIX = {
  add: '+ ',
  del: '- ',
  context: '  ',
};

export const DiffView = ({ hunks, title }: DiffViewProps) => {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border-warm">
      {title && (
        <div className="border-b border-border-warm bg-warm-sand px-3 py-1.5 text-xs font-medium text-charcoal-warm">
          {title}
        </div>
      )}
      <div className="overflow-x-auto p-0">
        <table className="w-full border-collapse font-mono text-xs leading-relaxed">
          <tbody>
            {hunks.map((line, index) => (
              <tr key={index} className={LINE_COLORS[line.type]}>
                <td className="w-8 select-none px-2 text-right text-olive-gray">
                  {line.lineNumber ?? ''}
                </td>
                <td className="px-1 text-olive-gray">{LINE_PREFIX[line.type]}</td>
                <td className="whitespace-pre-wrap px-2">{line.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export type { DiffLine };
