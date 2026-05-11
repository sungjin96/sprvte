'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ApiKeyFieldProps {
  providerName: string;
  displayName: string;
  hasKey?: boolean;
  onSave: (key: string) => Promise<void>;
}

function ApiKeyField({ displayName, hasKey, onSave }: ApiKeyFieldProps) {
  const t = useTranslations('settings.providers');
  const [editing, setEditing] = useState(!hasKey);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onSave(value.trim());
      setSaved(true);
      setEditing(false);
      setValue('');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--text)]">{displayName} {t('apiKey')}</span>
        {hasKey && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono text-[var(--text-3)] hover:text-[var(--neon)] transition-colors"
          >
            {t('change')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2">
          <Input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('apiKeyPlaceholder', { name: displayName })}
            className="flex-1"
          />
          <Button type="button" variant="primary" onClick={handleSave} disabled={loading || !value.trim()}>
            {loading ? t('saving') : t('save')}
          </Button>
          {hasKey && (
            <Button type="button" variant="ghost" onClick={() => { setEditing(false); setValue(''); }}>
              {t('cancel')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--g1)]">
          <span className="text-[13px] font-mono text-[var(--text-3)] tracking-widest">
            {hasKey ? t('apiKeyMasked') : t('apiKeyNotSet')}
          </span>
          {saved && (
            <span className="text-[11px] text-[var(--neon)] font-mono ml-auto">{t('saved')}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { ApiKeyField };
