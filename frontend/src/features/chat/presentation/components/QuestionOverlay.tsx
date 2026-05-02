import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import type { PendingQuestion } from '../store/chatStore';
import { KraidIcon, CheckIcon, SendIcon } from '../../../../core/presentation/components/icons';

const SingleChoiceView = ({ question, onSubmit }: { question: PendingQuestion; onSubmit: (answer: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        {question.options?.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
              selected === option
                ? 'border-accent bg-accent/10 text-text'
                : 'border-border-warm text-charcoal-warm hover:border-accent/50 hover:bg-accent/5'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected === option ? 'border-accent bg-accent' : 'border-warm-silver'
              }`}
            >
              {selected === option && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected}
        className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
      >
        Confirmar
      </button>
    </>
  );
};

const MultipleChoiceView = ({ question, onSubmit }: { question: PendingQuestion; onSubmit: (answer: string) => void }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (option: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {question.options?.map((option) => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
              selected.has(option)
                ? 'border-accent bg-accent/10 text-text'
                : 'border-border-warm text-charcoal-warm hover:border-accent/50 hover:bg-accent/5'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                selected.has(option) ? 'border-accent bg-accent' : 'border-warm-silver'
              }`}
            >
              {selected.has(option) && <CheckIcon className="h-2.5 w-2.5 text-white" />}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => selected.size > 0 && onSubmit(Array.from(selected).join(', '))}
        disabled={selected.size === 0}
        className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
      >
        Confirmar ({selected.size})
      </button>
    </>
  );
};

const FreeTextView = ({ question, onSubmit }: { question: PendingQuestion; onSubmit: (answer: string) => void }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-border-warm bg-bg px-3 py-2.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={question.placeholder ?? 'Escribe tu respuesta...'}
          className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-warm-silver"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-opacity disabled:opacity-40"
        >
          <SendIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
};

export const QuestionOverlay = () => {
  const { pendingQuestion, answerQuestion } = useChatStore();

  if (!pendingQuestion) return null;

  const handleSubmit = (answer: string) => {
    answerQuestion(answer);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center pb-44 pointer-events-none">
      <div className="pointer-events-auto relative w-full max-w-md px-4 animate-scale-in">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border-warm shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ivory">
              <KraidIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif text-sm font-medium text-text">Kraid tiene una pregunta</span>
          </div>

          {/* Question */}
          <p className="mb-4 text-sm leading-relaxed text-charcoal-warm">{pendingQuestion.question}</p>

          {/* Answer area */}
          {pendingQuestion.type === 'single_choice' && (
            <SingleChoiceView question={pendingQuestion} onSubmit={handleSubmit} />
          )}
          {pendingQuestion.type === 'multiple_choice' && (
            <MultipleChoiceView question={pendingQuestion} onSubmit={handleSubmit} />
          )}
          {pendingQuestion.type === 'free_text' && (
            <FreeTextView question={pendingQuestion} onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </div>
  );
};
