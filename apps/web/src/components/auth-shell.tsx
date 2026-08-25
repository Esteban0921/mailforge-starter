import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BackToHome } from '@/components/wordmark';

export function AuthShell({
  title,
  subtitle,
  titleTestId,
  children,
}: {
  title: string;
  subtitle: string;
  titleTestId: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <BackToHome className="mb-8" />
        <Card>
          <CardContent className="p-6">
            <h1 data-testid={titleTestId} className="text-xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-1.5 mb-6 text-sm text-muted-foreground">{subtitle}</p>
            {children}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
