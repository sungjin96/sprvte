import { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  heading: string;
  body?: string;
  cta?: ReactNode;
  className?: string;
  showMascot?: boolean;
}

function EmptyState({ heading, body, cta, className, showMascot = true }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {showMascot && (
        <div className="w-24 h-24 mb-6 opacity-30">
          <Image
            src="/assets/mascot-full.svg"
            alt="Sprvte mascot"
            width={96}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">{heading}</h3>
      {body && <p className="text-[13px] text-[var(--text-2)] max-w-xs mb-5">{body}</p>}
      {cta && <div>{cta}</div>}
    </div>
  );
}

export { EmptyState };
