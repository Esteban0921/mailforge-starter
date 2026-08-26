'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getAudienceStore, type ImportSubscribersResult } from '@/lib/audiences';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function ImportCsvForm({
  audienceId,
  onImported,
}: {
  audienceId: string;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportSubscribersResult | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setResult(null);
    const csvText = await readFileAsText(file);
    const outcome = await getAudienceStore().importSubscribersFromCsv(audienceId, csvText);
    setBusy(false);
    setResult(outcome);
    if (inputRef.current) inputRef.current.value = '';

    if (outcome.imported > 0) {
      toast(`${outcome.imported} suscriptor(es) importado(s).`);
      onImported();
    }
    if (outcome.skipped.length > 0) {
      toast(`${outcome.skipped.length} fila(s) omitida(s) — revisa el detalle abajo.`, 'error');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
        id="csv-input"
        disabled={busy}
      />
      <Button
        type="button"
        variant="outline"
        busy={busy}
        onClick={() => inputRef.current?.click()}
        className="self-start"
      >
        {!busy && <Upload className="size-4" aria-hidden="true" />}
        {busy ? 'Importando…' : 'Importar CSV'}
      </Button>
      {result && result.skipped.length > 0 ? (
        <ul className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
          {result.skipped.map((row) => (
            <li key={row.line}>
              Línea {row.line}: {SKIP_REASON_LABEL[row.reason]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const SKIP_REASON_LABEL: Record<string, string> = {
  missing_email: 'sin email',
  invalid_email: 'email inválido',
  duplicate_email: 'email duplicado',
};
