import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './toast';

function Trigger({
  message = 'Guardado',
  variant,
}: {
  message?: string;
  variant?: 'success' | 'error';
}) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast(message, variant)}>
      Disparar
    </button>
  );
}

describe('ToastProvider / useToast', () => {
  it('throws when used outside a ToastProvider', () => {
    // Swallow the expected React error-boundary console noise for this one assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });

  it('shows a toast after calling toast() and lets it be dismissed', async () => {
    render(
      <ToastProvider>
        <Trigger message="Sesión cerrada." />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Disparar' }));
    expect(await screen.findByText('Sesión cerrada.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    await waitFor(() => expect(screen.queryByText('Sesión cerrada.')).not.toBeInTheDocument());
  });

  it('auto-dismisses after the timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <Trigger message="Perfil actualizado." />
      </ToastProvider>,
    );

    await userEvent.setup({ delay: null }).click(screen.getByRole('button', { name: 'Disparar' }));
    expect(screen.getByText('Perfil actualizado.')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText('Perfil actualizado.')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders an error-variant toast distinctly', async () => {
    render(
      <ToastProvider>
        <Trigger message="No se pudo guardar." variant="error" />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Disparar' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('No se pudo guardar.');
    expect(status.className).toContain('border-destructive');
  });
});
