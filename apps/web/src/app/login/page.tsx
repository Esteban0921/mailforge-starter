import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Entrar · MailForge',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-hierro px-4 text-papel">
      <div className="w-full max-w-sm">
        <a href="/" className="font-mono text-xs tracking-[0.25em] text-ceniza hover:text-brasa">
          ← MAILFORGE
        </a>
        <h1 data-testid="login-title" className="mt-6 mb-6 text-3xl font-extrabold tracking-tight">
          Entra en tu taller
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
