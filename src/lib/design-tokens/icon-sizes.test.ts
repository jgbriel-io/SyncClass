import { describe, it, expect } from 'vitest';
import {
  ICON_SIZES,
  ICON_SIZES_PX,
  iconSize,
  getIconSizePx,
  type IconSize,
} from './icon-sizes';

describe('Design Tokens: Icon Sizes', () => {
  describe('ICON_SIZES', () => {
    it('deve ter 5 tamanhos definidos', () => {
      expect(Object.keys(ICON_SIZES)).toHaveLength(5);
    });

    it('deve ter os valores corretos', () => {
      expect(ICON_SIZES.XS).toBe('h-3.5 w-3.5');
      expect(ICON_SIZES.SM).toBe('h-4 w-4');
      expect(ICON_SIZES.MD).toBe('h-5 w-5');
      expect(ICON_SIZES.LG).toBe('h-6 w-6');
      expect(ICON_SIZES.XL).toBe('h-8 w-8');
    });

    it('deve ter formato consistente (h-X w-X)', () => {
      Object.values(ICON_SIZES).forEach(value => {
        expect(value).toMatch(/^h-[\d.]+ w-[\d.]+$/);
      });
    });
  });

  describe('ICON_SIZES_PX', () => {
    it('deve ter 5 tamanhos definidos', () => {
      expect(Object.keys(ICON_SIZES_PX)).toHaveLength(5);
    });

    it('deve ter os valores em pixels corretos', () => {
      expect(ICON_SIZES_PX.XS).toBe(14);
      expect(ICON_SIZES_PX.SM).toBe(16);
      expect(ICON_SIZES_PX.MD).toBe(20);
      expect(ICON_SIZES_PX.LG).toBe(24);
      expect(ICON_SIZES_PX.XL).toBe(32);
    });

    it('deve ter valores crescentes', () => {
      expect(ICON_SIZES_PX.XS).toBeLessThan(ICON_SIZES_PX.SM);
      expect(ICON_SIZES_PX.SM).toBeLessThan(ICON_SIZES_PX.MD);
      expect(ICON_SIZES_PX.MD).toBeLessThan(ICON_SIZES_PX.LG);
      expect(ICON_SIZES_PX.LG).toBeLessThan(ICON_SIZES_PX.XL);
    });

    it('deve ter valores múltiplos de 2', () => {
      Object.values(ICON_SIZES_PX).forEach(value => {
        expect(value % 2).toBe(0);
      });
    });
  });

  describe('iconSize()', () => {
    it('deve retornar a classe correta para cada tamanho', () => {
      expect(iconSize('XS')).toBe('h-3.5 w-3.5');
      expect(iconSize('SM')).toBe('h-4 w-4');
      expect(iconSize('MD')).toBe('h-5 w-5');
      expect(iconSize('LG')).toBe('h-6 w-6');
      expect(iconSize('XL')).toBe('h-8 w-8');
    });

    it('deve retornar string que pode ser usada em className', () => {
      const sizes: IconSize[] = ['XS', 'SM', 'MD', 'LG', 'XL'];
      sizes.forEach(size => {
        const result = iconSize(size);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('deve ser compatível com template literals', () => {
      const className = `${iconSize('SM')} text-primary`;
      expect(className).toBe('h-4 w-4 text-primary');
    });
  });

  describe('getIconSizePx()', () => {
    it('deve retornar o valor em pixels correto', () => {
      expect(getIconSizePx('XS')).toBe(14);
      expect(getIconSizePx('SM')).toBe(16);
      expect(getIconSizePx('MD')).toBe(20);
      expect(getIconSizePx('LG')).toBe(24);
      expect(getIconSizePx('XL')).toBe(32);
    });

    it('deve retornar número', () => {
      const sizes: IconSize[] = ['XS', 'SM', 'MD', 'LG', 'XL'];
      sizes.forEach(size => {
        const result = getIconSizePx(size);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      });
    });
  });

  describe('Hierarquia de tamanhos', () => {
    it('deve seguir ordem crescente (XS < SM < MD < LG < XL)', () => {
      expect(ICON_SIZES_PX.XS).toBeLessThan(ICON_SIZES_PX.SM);
      expect(ICON_SIZES_PX.SM).toBeLessThan(ICON_SIZES_PX.MD);
      expect(ICON_SIZES_PX.MD).toBeLessThan(ICON_SIZES_PX.LG);
      expect(ICON_SIZES_PX.LG).toBeLessThan(ICON_SIZES_PX.XL);
    });

    it('deve ter diferenças proporcionais entre tamanhos', () => {
      // XS -> SM: +2px
      expect(ICON_SIZES_PX.SM - ICON_SIZES_PX.XS).toBe(2);
      // SM -> MD: +4px
      expect(ICON_SIZES_PX.MD - ICON_SIZES_PX.SM).toBe(4);
      // MD -> LG: +4px
      expect(ICON_SIZES_PX.LG - ICON_SIZES_PX.MD).toBe(4);
      // LG -> XL: +8px
      expect(ICON_SIZES_PX.XL - ICON_SIZES_PX.LG).toBe(8);
    });
  });

  describe('Consistência entre ICON_SIZES e ICON_SIZES_PX', () => {
    it('deve ter as mesmas chaves', () => {
      const sizeKeys = Object.keys(ICON_SIZES);
      const pxKeys = Object.keys(ICON_SIZES_PX);
      expect(sizeKeys).toEqual(pxKeys);
    });

    it('deve ter correspondência entre classes e valores px', () => {
      // h-3.5 w-3.5 = 14px
      expect(ICON_SIZES.XS).toContain('3.5');
      expect(ICON_SIZES_PX.XS).toBe(14);

      // h-4 w-4 = 16px
      expect(ICON_SIZES.SM).toContain('4');
      expect(ICON_SIZES_PX.SM).toBe(16);

      // h-5 w-5 = 20px
      expect(ICON_SIZES.MD).toContain('5');
      expect(ICON_SIZES_PX.MD).toBe(20);

      // h-6 w-6 = 24px
      expect(ICON_SIZES.LG).toContain('6');
      expect(ICON_SIZES_PX.LG).toBe(24);

      // h-8 w-8 = 32px
      expect(ICON_SIZES.XL).toContain('8');
      expect(ICON_SIZES_PX.XL).toBe(32);
    });
  });

  describe('Casos de uso comuns', () => {
    it('SM deve ser o tamanho padrão (mais usado)', () => {
      // SM (16px) é o tamanho mais comum no projeto
      expect(iconSize('SM')).toBe('h-4 w-4');
      expect(getIconSizePx('SM')).toBe(16);
    });

    it('deve funcionar em contextos de botões', () => {
      const buttonIconClass = iconSize('SM');
      expect(buttonIconClass).toBe('h-4 w-4');
    });

    it('deve funcionar em contextos de logos', () => {
      const logoIconClass = iconSize('LG');
      expect(logoIconClass).toBe('h-6 w-6');
    });

    it('deve funcionar em contextos de checkboxes', () => {
      const checkboxIconClass = iconSize('XS');
      expect(checkboxIconClass).toBe('h-3.5 w-3.5');
    });

    it('deve funcionar em contextos de hero sections', () => {
      const heroIconClass = iconSize('XL');
      expect(heroIconClass).toBe('h-8 w-8');
    });
  });

  describe('Acessibilidade', () => {
    it('tamanho mínimo deve ser 14px (XS)', () => {
      const minSize = Math.min(...Object.values(ICON_SIZES_PX));
      expect(minSize).toBe(14);
      expect(minSize).toBeGreaterThanOrEqual(14); // Mínimo recomendado
    });

    it('todos os tamanhos devem ser >= 14px', () => {
      Object.values(ICON_SIZES_PX).forEach(size => {
        expect(size).toBeGreaterThanOrEqual(14);
      });
    });
  });

  describe('Type Safety', () => {
    it('deve aceitar apenas tamanhos válidos', () => {
      const validSizes: IconSize[] = ['XS', 'SM', 'MD', 'LG', 'XL'];
      validSizes.forEach(size => {
        expect(() => iconSize(size)).not.toThrow();
        expect(() => getIconSizePx(size)).not.toThrow();
      });
    });
  });
});
