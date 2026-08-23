import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MailForge',
  description: 'Plataforma multi-tenant de email marketing, self-hosted y open-source.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
