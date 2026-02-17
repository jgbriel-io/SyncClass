import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCPF, formatPhone } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format number to BRL currency', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1.000');
      expect(result).toContain('00');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('formatCPF', () => {
    it('should format CPF with mask', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });

    it('should return original for invalid length', () => {
      expect(formatCPF('123456')).toBe('123456');
    });

    it('should handle empty string', () => {
      expect(formatCPF('')).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('should format mobile phone with DDD', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should format landline', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should return original for invalid length', () => {
      expect(formatPhone('11987')).toBe('11987');
    });

    it('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });
  });
});
