'use client';

// Last-resort fallback when the root layout itself fails to render.
// Cannot use i18n here — the layout (which sets up NextIntlClientProvider) crashed.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, background: '#08080c', color: '#eaeaea', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 13, color: '#9a9a9a', marginBottom: 24 }}>
              The application encountered an unexpected error.
            </p>
            {error.digest && (
              <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#5a5a5a', marginBottom: 16, wordBreak: 'break-all' }}>
                id: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: '#00E5A0',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
