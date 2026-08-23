import { describe, expect, it, vi } from 'vitest';
import {
  escapeHtml,
  MissingTemplateVariablesError,
  renderTemplate,
  renderTemplateStrict,
} from './render-template';

describe('renderTemplate', () => {
  it('interpolates flat variables', () => {
    expect(renderTemplate('Hola {{nombre}}, bienvenido', { data: { nombre: 'Ana' } })).toBe(
      'Hola Ana, bienvenido',
    );
  });

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('Hola {{ nombre }}!', { data: { nombre: 'Ana' } })).toBe('Hola Ana!');
  });

  it('HTML-escapes interpolated values by default', () => {
    const out = renderTemplate('<b>{{bio}}</b>', { data: { bio: '<script>alert(1)</script>' } });
    expect(out).toBe('<b>&lt;script&gt;alert(1)&lt;/script&gt;</b>');
  });

  it('can emit raw values when explicitly allowed', () => {
    const out = renderTemplate('{{html}}', { data: { html: '<b>ok</b>' }, escapeValues: false });
    expect(out).toBe('<b>ok</b>');
  });

  it('removes unknown placeholders and reports them', () => {
    const onUnknownVariable = vi.fn();
    const out = renderTemplate('Hola {{nombre}} {{apellido}}', {
      data: { nombre: 'Ana' },
      onUnknownVariable,
    });
    expect(out).toBe('Hola Ana ');
    expect(onUnknownVariable).toHaveBeenCalledExactlyOnceWith('apellido');
  });

  it('renders numbers and booleans', () => {
    expect(renderTemplate('{{n}}-{{flag}}', { data: { n: 42, flag: false } })).toBe('42-false');
  });

  it('renders an empty string for null/undefined values that DO exist', () => {
    expect(renderTemplate('A{{x}}B', { data: { x: null, y: undefined } })).toBe('AB');
  });
});

describe('renderTemplateStrict', () => {
  it('renders when every placeholder has a value', () => {
    expect(renderTemplateStrict('{{a}}/{{b}}', { a: 1, b: 2 })).toBe('1/2');
  });

  it('throws listing every missing variable, sorted', () => {
    expect(() => renderTemplateStrict('{{z}} {{a}} {{m}}', {})).toThrowError(
      new MissingTemplateVariablesError(['a', 'm', 'z']),
    );
  });

  it('does not treat an unknown variable as fatal when data covers it', () => {
    expect(renderTemplateStrict('{{x}}', { x: '' })).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes the five dangerous characters', () => {
    expect(escapeHtml(`<a href="x">'&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;');
  });

  it('stringifies non-string values', () => {
    expect(escapeHtml(10)).toBe('10');
  });
});
