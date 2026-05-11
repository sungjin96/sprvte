'use client';

import { useTranslations } from 'next-intl';
import { ReferenceType } from '@/types/entity';
import { ReferenceImageSlot } from './ReferenceImageSlot';

export interface ReferenceSlotState {
  type: ReferenceType;
  imageUrl?: string;
  status: 'empty' | 'pending' | 'ready';
}

interface ReferenceImageStripProps {
  slots: ReferenceSlotState[];
  onGenerate?: (type: ReferenceType) => void;
  onRemove?: (type: ReferenceType) => void;
}

function ReferenceImageStrip({ slots, onGenerate, onRemove }: ReferenceImageStripProps) {
  const t = useTranslations('guide');
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">{t('references')}</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {slots.map((slot) => (
          <ReferenceImageSlot
            key={slot.type}
            type={slot.type}
            imageUrl={slot.imageUrl}
            status={slot.status}
            onGenerate={onGenerate ? () => onGenerate(slot.type) : undefined}
            onRemove={onRemove && slot.status === 'ready' ? () => onRemove(slot.type) : undefined}
            className="w-[120px] shrink-0"
          />
        ))}
      </div>
    </div>
  );
}

export { ReferenceImageStrip };
