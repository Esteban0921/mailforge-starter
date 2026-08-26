import type { Metadata } from 'next';
import { AudiencesContent } from '@/components/audiences/audiences-content';

export const metadata: Metadata = {
  title: 'Audiencias · MailForge',
};

export default function AudiencesPage() {
  return <AudiencesContent />;
}
