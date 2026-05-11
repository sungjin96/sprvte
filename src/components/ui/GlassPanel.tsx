import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 패널 강도: 'default' rgba 0.04 / 'raised' rgba 0.08 */
  level?: 'default' | 'raised';
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ level = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border backdrop-blur-glass backdrop-saturate-glass',
          level === 'default' && 'bg-[rgba(255,255,255,0.04)] border-[var(--border)]',
          level === 'raised'  && 'bg-[rgba(255,255,255,0.08)] border-[var(--border-hi)]',
          className,
        )}
        style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassPanel.displayName = 'GlassPanel';
export { GlassPanel };
