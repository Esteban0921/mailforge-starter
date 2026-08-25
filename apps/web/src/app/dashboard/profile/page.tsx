import type { Metadata } from 'next';
import { ProfileContent } from '@/components/profile-content';

export const metadata: Metadata = {
  title: 'Perfil · MailForge',
};

export default function ProfilePage() {
  return <ProfileContent />;
}
