import type { Metadata } from 'next';
import { Activity, Megaphone, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard · MailForge',
};

const MODULES = [
  { name: 'Audiencias', icon: Users },
  { name: 'Campañas', icon: Megaphone },
  { name: 'Automatizaciones', icon: Zap },
  { name: 'Tracking', icon: Activity },
] as const;

export default function DashboardPage() {
  return (
    <section>
      <h1 data-testid="dashboard-title" className="text-2xl font-semibold tracking-tight">
        Bienvenido de nuevo
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Aquí verás un resumen de tu actividad. Las audiencias y campañas llegan en las próximas
        fases.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULES.map(({ name, icon: Icon }) => (
          <Card key={name} data-testid={`module-card-${name}`}>
            <CardContent className="flex items-start justify-between p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-foreground">{name}</p>
              </div>
              <Badge variant="muted">Próximamente</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
