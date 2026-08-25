import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth-shell';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Crear cuenta · MailForge',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a gestionar tus audiencias en minutos."
      titleTestId="register-title"
    >
      <RegisterForm />
    </AuthShell>
  );
}
