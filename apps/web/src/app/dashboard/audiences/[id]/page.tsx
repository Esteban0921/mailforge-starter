import type { Metadata } from 'next';
import { AudienceDetailContent } from '@/components/audiences/audience-detail-content';

export const metadata: Metadata = {
  title: 'Audiencia · MailForge',
};

export default async function AudienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AudienceDetailContent audienceId={id} />;
}
