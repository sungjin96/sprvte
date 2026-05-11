import { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  // Phase B: enforce role='admin' check via middleware/RLS.
  // For UI-first MVP we trust the route guard upstream.
  return <AdminShell locale={locale}>{children}</AdminShell>;
}
