import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Crear cuenta · MailForge',
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-hierro px-4 text-papel">
      <div className="w-full max-w-sm">
        <a href="/" className="font-mono text-xs tracking-[0.25em] text-ceniza hover:text-brasa">
          ← MAILFORGE
        </a>
        <h1
          data-testid="register-title"
          className="mt-6 mb-6 text-3xl font-extrabold tracking-tight"
        >
          Crea tu cuenta
        </h1>
        <RegisterForm />
      </div>
    </main>
  );
}
