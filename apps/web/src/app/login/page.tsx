import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Entrar · MailForge',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Introduce tus datos para acceder a tu cuenta."
      titleTestId="login-title"
    >
      <LoginForm />
    </AuthShell>
  );
}
