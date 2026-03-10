/**
 * Testes para utilitários de sanitização XSS
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, escapeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('deve remover scripts', () => {
    const dirty = '<script>alert("XSS")</script>Texto seguro';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('Texto seguro');
    expect(clean).not.toContain('<script>');
  });

  it('deve permitir tags básicas de formatação', () => {
    const dirty = '<b>Negrito</b> e <i>itálico</i>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<b>Negrito</b> e <i>itálico</i>');
  });

  it('deve remover event handlers', () => {
    const dirty = '<img src=x onerror="alert(1)">';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('alert');
  });

  it('deve remover iframes', () => {
    const dirty = '<iframe src="evil.com"></iframe>Texto';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<iframe>');
    expect(clean).toBe('Texto');
  });

  it('deve permitir quebras de linha', () => {
    const dirty = 'Linha 1<br>Linha 2';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('Linha 1<br>Linha 2');
  });

  it('deve permitir parágrafos', () => {
    const dirty = '<p>Parágrafo 1</p><p>Parágrafo 2</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('<p>');
  });

  it('deve permitir listas', () => {
    const dirty = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('<ul>');
    expect(clean).toContain('<li>');
  });

  it('deve remover javascript: URLs', () => {
    const dirty = '<a href="javascript:alert(1)">Link</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('deve retornar string vazia para null', () => {
    expect(sanitizeHtml(null)).toBe('');
  });

  it('deve retornar string vazia para undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('deve retornar string vazia para string vazia', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('deve remover todas as tags HTML', () => {
    const dirty = '<b>Negrito</b> e <i>itálico</i>';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Negrito e itálico');
    expect(clean).not.toContain('<');
  });

  it('deve remover scripts', () => {
    const dirty = '<script>alert("XSS")</script>Texto';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Texto');
  });

  it('deve preservar o conteúdo de texto', () => {
    const dirty = '<div><p>Texto <b>importante</b></p></div>';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Texto importante');
  });

  it('deve retornar string vazia para null', () => {
    expect(sanitizeText(null)).toBe('');
  });

  it('deve retornar string vazia para undefined', () => {
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('deve escapar < e >', () => {
    const text = '<script>alert(1)</script>';
    const escaped = escapeHtml(text);
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
  });

  it('deve escapar aspas duplas', () => {
    const text = 'Texto com "aspas"';
    const escaped = escapeHtml(text);
    expect(escaped).toContain('&quot;');
  });

  it('deve escapar aspas simples', () => {
    const text = "Texto com 'aspas'";
    const escaped = escapeHtml(text);
    expect(escaped).toContain('&#x27;');
  });

  it('deve escapar &', () => {
    const text = 'A & B';
    const escaped = escapeHtml(text);
    expect(escaped).toBe('A &amp; B');
  });

  it('deve escapar /', () => {
    const text = '</script>';
    const escaped = escapeHtml(text);
    expect(escaped).toContain('&#x2F;');
  });

  it('deve retornar string vazia para null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('deve retornar string vazia para undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('não deve alterar texto sem caracteres especiais', () => {
    const text = 'Texto normal sem caracteres especiais';
    expect(escapeHtml(text)).toBe(text);
  });
});

describe('Casos de uso reais', () => {
  it('deve sanitizar descrição de atividade com formatação', () => {
    const description = `
      <p>Leia o capítulo 5 e responda:</p>
      <ul>
        <li>Questão 1</li>
        <li>Questão 2</li>
      </ul>
      <script>alert('XSS')</script>
    `;
    const clean = sanitizeHtml(description);
    expect(clean).toContain('<p>');
    expect(clean).toContain('<ul>');
    expect(clean).toContain('<li>');
    expect(clean).not.toContain('<script>');
  });

  it('deve sanitizar feedback de professor', () => {
    const feedback = 'Ótimo trabalho! <script>steal()</script>';
    const clean = sanitizeText(feedback);
    expect(clean).toBe('Ótimo trabalho! ');
  });

  it('deve escapar observações de aluno', () => {
    const observations = 'Aluno com dificuldade em <matemática>';
    const escaped = escapeHtml(observations);
    expect(escaped).toContain('&lt;matemática&gt;');
  });
});
