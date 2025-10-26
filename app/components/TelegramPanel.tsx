'use client';

import { FormEvent, useState } from 'react';

type Props = {
  selectedCount: number;
  messagePreview: string;
  resetSelection: () => void;
};

type Status = 'idle' | 'sending' | 'success' | 'error';

const initialHelpMessage =
  'Provide your Telegram bot token and the target channel ID (use @username format or numeric ID).';

export default function TelegramPanel({ selectedCount, messagePreview, resetSelection }: Props) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState(initialHelpMessage);

  const canSend = selectedCount > 0 && token.length > 10 && chatId.length > 0;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      setStatus('error');
      setStatusMessage('Please provide authentication details and select at least one story.');
      return;
    }

    setStatus('sending');
    setStatusMessage('Sending briefing to Telegram…');

    const finalMessage = note.trim()
      ? `${note.trim()}\n\n${messagePreview}`
      : messagePreview;

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          chatId,
          text: finalMessage
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Telegram rejected the message');
      }

      setStatus('success');
      setStatusMessage('Successfully delivered to Telegram.');
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unexpected error sending to Telegram');
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <header>
        <h2 style={{ margin: 0 }}>Telegram Dispatch Center</h2>
        <p className="muted" style={{ marginTop: '0.4rem' }}>
          Use your Telegram bot credentials to post the selected intelligence briefing directly to a channel or group.
        </p>
      </header>

      <div
        style={{
          padding: '1rem',
          borderRadius: '1rem',
          background:
            status === 'success'
              ? 'rgba(34, 197, 94, 0.18)'
              : status === 'error'
                ? 'rgba(248, 113, 113, 0.15)'
                : 'rgba(148, 163, 184, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: status === 'error' ? 'rgba(248, 113, 113, 0.9)' : 'rgba(226, 232, 240, 0.9)'
        }}
      >
        {statusMessage}
      </div>

      <form
        onSubmit={submit}
        style={{ display: 'grid', gap: '1.4rem' }}
        autoComplete="off"
      >
        <div className="grid" style={{ gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="muted">Telegram Bot Token</span>
            <input
              type="password"
              placeholder="123456789:ABCDEF_your-secret-token"
              value={token}
              onChange={(event) => setToken(event.target.value.trim())}
              autoComplete="off"
            />
          </label>
          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="muted">Channel or Chat ID</span>
            <input
              type="text"
              placeholder="@your_channel or -1001234567890"
              value={chatId}
              onChange={(event) => setChatId(event.target.value.trim())}
              autoComplete="off"
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: '0.5rem' }}>
          <span className="muted">Optional intro note</span>
          <textarea
            rows={3}
            placeholder="Add a personalised intro before the intelligence briefing…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <span className="muted">Message preview ({selectedCount} stories)</span>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '1rem',
              padding: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.85rem',
              maxHeight: '260px',
              overflow: 'auto'
            }}
          >
            {note.trim() ? `${note.trim()}\n\n${messagePreview}` : messagePreview}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="submit" className="button-primary" disabled={!canSend || status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send to Telegram'}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={resetSelection}
            disabled={selectedCount === 0}
          >
            Clear selection
          </button>
        </div>
      </form>
    </section>
  );
}
