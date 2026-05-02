import type { ToolCallStatus } from '../../../domain/entities/Message';

interface QuestionBlockProps {
  input: Record<string, unknown>;
  status: ToolCallStatus;
  output?: string;
}

export const QuestionBlock = ({ input, status, output }: QuestionBlockProps) => {
  const question = (input.question as string) ?? '';
  const answer = output ?? '';

  if (status === 'running') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border-warm bg-bg px-3 py-2 text-sm text-charcoal-warm">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span className="italic">Esperando respuesta...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-warm bg-bg px-3 py-2 text-sm">
      <span className="text-olive-gray">{question}</span>
      {answer && !answer.startsWith('Error') && (
        <span className="ml-2 font-medium text-accent">&rarr; {answer}</span>
      )}
      {answer && answer.startsWith('Error') && (
        <span className="ml-2 text-error">&rarr; {answer}</span>
      )}
    </div>
  );
};
