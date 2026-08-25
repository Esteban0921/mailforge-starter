import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, LinkButton } from './button';

describe('Button', () => {
  it('renders its children and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the button and shows a spinner while busy', () => {
    render(<Button busy>Enviando</Button>);

    const button = screen.getByRole('button', { name: 'Enviando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('respects an explicit type="submit"', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

describe('LinkButton', () => {
  it('renders a real anchor, not a button, so it stays valid HTML for navigation', () => {
    render(<LinkButton href="/register">Crear cuenta</LinkButton>);

    const link = screen.getByRole('link', { name: 'Crear cuenta' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/register');
  });
});
