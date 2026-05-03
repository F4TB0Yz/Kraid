import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../../../core/config';
import { CloseIcon, ScrollTextIcon, CheckIcon } from '../../../../core/presentation/components/icons';

interface AgentRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentRulesModal = ({ isOpen, onClose }: AgentRulesModalProps) => {
  const [content, setContent] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/agent/rules`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content);
        setOriginal(data.content);
      })
      .catch(() => setError('No se pudo cargar el prompt del agente.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, loading]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setOriginal(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('No se pudo guardar. Verifica que el backend esté activo.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isDirty = content !== original;
  const charCount = content.length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-message-slide-up"
      style={{ animationDuration: '0.15s' }}
      onKeyDown={handleKeyDown}
    >
      <div className="flex w-full max-w-4xl flex-col rounded-2xl bg-card shadow-2xl ring-1 ring-border"
        style={{ height: 'min(85vh, 760px)' }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ScrollTextIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-text leading-tight">Reglas del Agente</h2>
              <p className="text-xs text-charcoal-warm">System prompt enviado al modelo en cada conversación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-warm-silver transition-colors hover:bg-warm-sand hover:text-text"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Variables hint */}
        <div className="shrink-0 border-b border-border/50 bg-accent/5 px-6 py-2.5">
          <p className="text-xs text-charcoal-warm">
            Variables disponibles:{' '}
            {['{TODAY}', '{current_scope}', '{context_snapshot}'].map((v) => (
              <code key={v} className="mx-1 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-accent">
                {v}
              </code>
            ))}
          </p>
        </div>

        {/* Editor */}
        <div className="relative min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full w-full resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-text placeholder-charcoal-warm focus:outline-none"
              spellCheck={false}
              placeholder="Escribe las instrucciones del agente aquí..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-error">{error}</span>}
            {!error && (
              <span className="text-xs text-charcoal-warm">
                {charCount.toLocaleString()} caracteres
                {isDirty && <span className="ml-2 text-accent">· cambios sin guardar</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !isDirty}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                saved
                  ? 'bg-success/20 text-success'
                  : isDirty
                  ? 'bg-accent text-white hover:opacity-90'
                  : 'cursor-not-allowed bg-accent/30 text-white/60'
              }`}
            >
              {saved ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Guardado
                </>
              ) : saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
