import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; projectId: string }>;
}

export default async function ProjectRootPage({ params }: Props) {
  const { locale, projectId } = await params;
  redirect(`/${locale}/projects/${projectId}/entities`);
}
