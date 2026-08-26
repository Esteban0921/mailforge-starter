import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationSwitcher } from './organization-switcher';

const SESSION = {
  user: { id: 'usr_1', email: 'ana@example.com', name: 'Ana' },
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MEMBERSHIPS = [
  {
    organization: {
      id: 'org_1',
      name: 'Clientes VIP',
      slug: 'clientes-vip',
      createdAt: '2026-01-01',
    },
    role: 'owner',
  },
  {
    organization: {
      id: 'org_2',
      name: 'Segunda Org',
      slug: 'segunda-org',
      createdAt: '2026-01-02',
    },
    role: 'admin',
  },
];

describe('OrganizationSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mailforge.session', JSON.stringify(SESSION));
  });

  it('shows the first organization once the list loads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, MEMBERSHIPS)));

    render(<OrganizationSwitcher />);

    expect(await screen.findByText('Clientes VIP')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('restores a previously selected organization instead of defaulting to the first', async () => {
    localStorage.setItem('mailforge.current-organization-id', 'org_2');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, MEMBERSHIPS)));

    render(<OrganizationSwitcher />);

    expect(await screen.findByText('Segunda Org')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('opens the list, switches organizations, and persists the choice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, MEMBERSHIPS)));
    const user = userEvent.setup();

    render(<OrganizationSwitcher />);
    await screen.findByText('Clientes VIP');

    await user.click(screen.getByTestId('organization-switcher-trigger'));
    await user.click(screen.getByRole('option', { name: 'Segunda Org' }));

    await waitFor(() => {
      expect(screen.getByTestId('organization-switcher-trigger')).toHaveTextContent('Segunda Org');
    });
    expect(localStorage.getItem('mailforge.current-organization-id')).toBe('org_2');
    vi.unstubAllGlobals();
  });

  it('renders nothing when the API is unreachable, instead of an endless spinner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { container } = render(<OrganizationSwitcher />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    vi.unstubAllGlobals();
  });
});
