import { describe, it, expect } from 'vitest';
import {
  TYPOGRAPHY,
  FONT_WEIGHTS,
  TEXT_COLORS,
  TYPOGRAPHY_SIZES_PX,
  typography,
  typographyWithColor,
  typographyWithWeight,
  customTypography,
} from './typography';

describe('Design Tokens: Typography', () => {
  describe('TYPOGRAPHY', () => {
    it('deve ter todas as variantes definidas', () => {
      expect(TYPOGRAPHY.DISPLAY).toBeDefined();
      expect(TYPOGRAPHY.H1).toBeDefined();
      expect(TYPOGRAPHY.H2).toBeDefined();
      expect(TYPOGRAPHY.H3).toBeDefined();
      expect(TYPOGRAPHY.BODY).toBeDefined();
      expect(TYPOGRAPHY.BODY_MEDIUM).toBeDefined();
      expect(TYPOGRAPHY.BODY_SEMIBOLD).toBeDefined();
      expect(TYPOGRAPHY.CAPTION).toBeDefined();
      expect(TYPOGRAPHY.CAPTION_MEDIUM).toBeDefined();
      expect(TYPOGRAPHY.CAPTION_SEMIBOLD).toBeDefined();
      expect(TYPOGRAPHY.SMALL).toBeDefined();
      expect(TYPOGRAPHY.SMALL_MEDIUM).toBeDefined();
      expect(TYPOGRAPHY.TABLE_HEADER).toBeDefined();
      expect(TYPOGRAPHY.LABEL).toBeDefined();
      expect(TYPOGRAPHY.HELPER).toBeDefined();
      expect(TYPOGRAPHY.ERROR).toBeDefined();
    });

    it('deve ter os valores corretos para títulos', () => {
      expect(TYPOGRAPHY.DISPLAY).toBe('text-4xl font-bold');
      expect(TYPOGRAPHY.H1).toBe('text-2xl font-semibold');
      expect(TYPOGRAPHY.H2).toBe('text-xl font-semibold');
      expect(TYPOGRAPHY.H3).toBe('text-lg font-medium');
    });

    it('deve ter os valores corretos para corpo de texto', () => {
      expect(TYPOGRAPHY.BODY).toBe('text-sm');
      expect(TYPOGRAPHY.BODY_MEDIUM).toBe('text-sm font-medium');
      expect(TYPOGRAPHY.BODY_SEMIBOLD).toBe('text-sm font-semibold');
    });

    it('deve ter os valores corretos para texto pequeno', () => {
      expect(TYPOGRAPHY.CAPTION).toBe('text-xs');
      expect(TYPOGRAPHY.CAPTION_MEDIUM).toBe('text-xs font-medium');
      expect(TYPOGRAPHY.CAPTION_SEMIBOLD).toBe('text-xs font-semibold');
    });

    it('deve ter os valores corretos para texto secundário', () => {
      expect(TYPOGRAPHY.SMALL).toBe('text-xs text-muted-foreground');
      expect(TYPOGRAPHY.SMALL_MEDIUM).toBe('text-xs font-medium text-muted-foreground');
    });

    it('deve ter os valores corretos para formulários', () => {
      expect(TYPOGRAPHY.LABEL).toBe('text-sm font-medium');
      expect(TYPOGRAPHY.HELPER).toBe('text-xs text-muted-foreground');
      expect(TYPOGRAPHY.ERROR).toBe('text-sm text-destructive');
    });

    it('deve ter o valor correto para header de tabela', () => {
      expect(TYPOGRAPHY.TABLE_HEADER).toBe('text-xs font-medium text-muted-foreground uppercase tracking-wider');
    });
  });

  describe('FONT_WEIGHTS', () => {
    it('deve ter todos os pesos definidos', () => {
      expect(FONT_WEIGHTS.NORMAL).toBe('font-normal');
      expect(FONT_WEIGHTS.MEDIUM).toBe('font-medium');
      expect(FONT_WEIGHTS.SEMIBOLD).toBe('font-semibold');
      expect(FONT_WEIGHTS.BOLD).toBe('font-bold');
    });
  });

  describe('TEXT_COLORS', () => {
    it('deve ter todas as cores definidas', () => {
      expect(TEXT_COLORS.DEFAULT).toBe('text-foreground');
      expect(TEXT_COLORS.MUTED).toBe('text-muted-foreground');
      expect(TEXT_COLORS.PRIMARY).toBe('text-primary');
      expect(TEXT_COLORS.SUCCESS).toBe('text-success');
      expect(TEXT_COLORS.WARNING).toBe('text-warning');
      expect(TEXT_COLORS.DESTRUCTIVE).toBe('text-destructive');
      expect(TEXT_COLORS.ACCENT).toBe('text-accent-foreground');
    });
  });

  describe('TYPOGRAPHY_SIZES_PX', () => {
    it('deve ter os valores em pixels corretos', () => {
      expect(TYPOGRAPHY_SIZES_PX.DISPLAY).toBe(36);
      expect(TYPOGRAPHY_SIZES_PX.H1).toBe(24);
      expect(TYPOGRAPHY_SIZES_PX.H2).toBe(20);
      expect(TYPOGRAPHY_SIZES_PX.H3).toBe(18);
      expect(TYPOGRAPHY_SIZES_PX.BODY).toBe(14);
      expect(TYPOGRAPHY_SIZES_PX.CAPTION).toBe(12);
    });
  });

  describe('typography()', () => {
    it('deve retornar a classe correta para cada variante', () => {
      expect(typography('DISPLAY')).toBe('text-4xl font-bold');
      expect(typography('H1')).toBe('text-2xl font-semibold');
      expect(typography('BODY')).toBe('text-sm');
      expect(typography('CAPTION')).toBe('text-xs');
      expect(typography('SMALL')).toBe('text-xs text-muted-foreground');
    });
  });

  describe('typographyWithColor()', () => {
    it('deve combinar variante com cor', () => {
      expect(typographyWithColor('BODY', 'MUTED')).toBe('text-sm text-muted-foreground');
      expect(typographyWithColor('CAPTION', 'DESTRUCTIVE')).toBe('text-xs text-destructive');
      expect(typographyWithColor('H1', 'PRIMARY')).toBe('text-2xl font-semibold text-primary');
    });
  });

  describe('typographyWithWeight()', () => {
    it('deve substituir o peso da fonte', () => {
      const result = typographyWithWeight('BODY', 'BOLD');
      expect(result).toContain('text-sm');
      expect(result).toContain('font-bold');
      expect(result).not.toContain('font-medium');
    });

    it('deve funcionar com variantes sem peso', () => {
      const result = typographyWithWeight('BODY', 'SEMIBOLD');
      expect(result).toContain('text-sm');
      expect(result).toContain('font-semibold');
    });

    it('deve remover peso existente antes de adicionar novo', () => {
      const result = typographyWithWeight('H1', 'NORMAL');
      expect(result).toContain('text-2xl');
      expect(result).toContain('font-normal');
      expect(result).not.toContain('font-semibold');
    });
  });

  describe('customTypography()', () => {
    it('deve criar classe com apenas tamanho', () => {
      expect(customTypography('sm')).toBe('text-sm');
      expect(customTypography('xs')).toBe('text-xs');
      expect(customTypography('2xl')).toBe('text-2xl');
    });

    it('deve criar classe com tamanho e peso', () => {
      expect(customTypography('sm', 'MEDIUM')).toBe('text-sm font-medium');
      expect(customTypography('xs', 'BOLD')).toBe('text-xs font-bold');
    });

    it('deve criar classe com tamanho, peso e cor', () => {
      expect(customTypography('sm', 'MEDIUM', 'PRIMARY')).toBe('text-sm font-medium text-primary');
      expect(customTypography('xs', 'SEMIBOLD', 'DESTRUCTIVE')).toBe('text-xs font-semibold text-destructive');
    });

    it('deve criar classe com tamanho e cor (sem peso)', () => {
      expect(customTypography('sm', undefined, 'MUTED')).toBe('text-sm text-muted-foreground');
    });
  });

  describe('Hierarquia de tamanhos', () => {
    it('DISPLAY deve ser maior que H1', () => {
      expect(TYPOGRAPHY_SIZES_PX.DISPLAY).toBeGreaterThan(TYPOGRAPHY_SIZES_PX.H1);
    });

    it('H1 deve ser maior que H2', () => {
      expect(TYPOGRAPHY_SIZES_PX.H1).toBeGreaterThan(TYPOGRAPHY_SIZES_PX.H2);
    });

    it('H2 deve ser maior que H3', () => {
      expect(TYPOGRAPHY_SIZES_PX.H2).toBeGreaterThan(TYPOGRAPHY_SIZES_PX.H3);
    });

    it('H3 deve ser maior que BODY', () => {
      expect(TYPOGRAPHY_SIZES_PX.H3).toBeGreaterThan(TYPOGRAPHY_SIZES_PX.BODY);
    });

    it('BODY deve ser maior que CAPTION', () => {
      expect(TYPOGRAPHY_SIZES_PX.BODY).toBeGreaterThan(TYPOGRAPHY_SIZES_PX.CAPTION);
    });
  });

  describe('Consistência de variantes', () => {
    it('BODY e LABEL devem ter o mesmo tamanho base', () => {
      expect(TYPOGRAPHY.BODY).toContain('text-sm');
      expect(TYPOGRAPHY.LABEL).toContain('text-sm');
    });

    it('CAPTION e SMALL devem ter o mesmo tamanho base', () => {
      expect(TYPOGRAPHY.CAPTION).toContain('text-xs');
      expect(TYPOGRAPHY.SMALL).toContain('text-xs');
    });

    it('HELPER e SMALL devem ter a mesma cor', () => {
      expect(TYPOGRAPHY.HELPER).toContain('text-muted-foreground');
      expect(TYPOGRAPHY.SMALL).toContain('text-muted-foreground');
    });
  });
});
