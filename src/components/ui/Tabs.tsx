'use client';

import { ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  active: string;
  onTabChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ active: '', onTabChange: () => {} });

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ active: value, onTabChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-[2px] p-[3px] rounded-[var(--r-md)]',
        'bg-[rgba(255,255,255,0.04)] border border-[var(--border)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { active, onTabChange } = useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      type="button"
      onClick={() => onTabChange(value)}
      className={cn(
        'px-4 py-[6px] rounded-[7px] text-[13px] font-medium cursor-pointer',
        'border transition-all duration-[120ms]',
        !isActive && 'text-[var(--text-2)] border-transparent hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.04)]',
        isActive  && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
