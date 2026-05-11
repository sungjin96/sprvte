import { ReactNode } from 'react';
import { GlobalShell } from '@/components/layout/GlobalShell';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function QueueLayout({ children, params }: Props) {
  const { locale } = await params;
  return <GlobalShell locale={locale}>{children}</GlobalShell>;
}
