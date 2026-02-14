import { describe, it, expect } from 'vitest';
import {
  STACK,
  GAP,
  CONTAINER,
  PADDING_X,
  PADDING_Y,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  SPACING_SCALE_PX,
  stack,
  gap,
  container,
  paddingX,
  paddingY,
  padding,
  marginTop,
  marginBottom,
} from './spacing';

describe('Design Tokens: Spacing', () => {
  describe('STACK', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(STACK)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(STACK.TIGHT).toBe('space-y-2');
      expect(STACK.DEFAULT).toBe('space-y-4');
      expect(STACK.LOOSE).toBe('space-y-6');
      expect(STACK.RELAXED).toBe('space-y-8');
    });
  });

  describe('GAP', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(GAP)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(GAP.TIGHT).toBe('gap-2');
      expect(GAP.DEFAULT).toBe('gap-3');
      expect(GAP.LOOSE).toBe('gap-4');
      expect(GAP.RELAXED).toBe('gap-6');
    });
  });

  describe('CONTAINER', () => {
    it('deve ter 3 tamanhos definidos', () => {
      expect(Object.keys(CONTAINER)).toHaveLength(3);
    });

    it('deve ter os valores corretos', () => {
      expect(CONTAINER.SM).toBe('px-4 py-3');
      expect(CONTAINER.DEFAULT).toBe('px-6 py-4');
      expect(CONTAINER.LG).toBe('px-8 py-6');
    });
  });

  describe('PADDING_X', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(PADDING_X)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(PADDING_X.SM).toBe('px-2');
      expect(PADDING_X.DEFAULT).toBe('px-4');
      expect(PADDING_X.MD).toBe('px-6');
      expect(PADDING_X.LG).toBe('px-8');
    });
  });

  describe('PADDING_Y', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(PADDING_Y)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(PADDING_Y.SM).toBe('py-2');
      expect(PADDING_Y.DEFAULT).toBe('py-4');
      expect(PADDING_Y.MD).toBe('py-6');
      expect(PADDING_Y.LG).toBe('py-8');
    });
  });

  describe('MARGIN_TOP', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(MARGIN_TOP)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(MARGIN_TOP.SM).toBe('mt-2');
      expect(MARGIN_TOP.DEFAULT).toBe('mt-4');
      expect(MARGIN_TOP.MD).toBe('mt-6');
      expect(MARGIN_TOP.LG).toBe('mt-8');
    });
  });

  describe('MARGIN_BOTTOM', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(MARGIN_BOTTOM)).toHaveLength(4);
    });

    it('deve ter os valores corretos', () => {
      expect(MARGIN_BOTTOM.SM).toBe('mb-2');
      expect(MARGIN_BOTTOM.DEFAULT).toBe('mb-4');
      expect(MARGIN_BOTTOM.MD).toBe('mb-6');
      expect(MARGIN_BOTTOM.LG).toBe('mb-8');
    });
  });

  describe('SPACING_SCALE_PX', () => {
    it('deve ter valores em pixels corretos', () => {
      expect(SPACING_SCALE_PX[2]).toBe(8);
      expect(SPACING_SCALE_PX[3]).toBe(12);
      expect(SPACING_SCALE_PX[4]).toBe(16);
      expect(SPACING_SCALE_PX[6]).toBe(24);
      expect(SPACING_SCALE_PX[8]).toBe(32);
    });

    it('deve seguir escala de 4px', () => {
      const values = Object.values(SPACING_SCALE_PX);
      values.forEach(value => {
        expect(value % 4).toBe(0);
      });
    });
  });

  describe('stack()', () => {
    it('deve retornar a classe correta', () => {
      expect(stack('TIGHT')).toBe('space-y-2');
      expect(stack('DEFAULT')).toBe('space-y-4');
      expect(stack('LOOSE')).toBe('space-y-6');
      expect(stack('RELAXED')).toBe('space-y-8');
    });
  });

  describe('gap()', () => {
    it('deve retornar a classe correta', () => {
      expect(gap('TIGHT')).toBe('gap-2');
      expect(gap('DEFAULT')).toBe('gap-3');
      expect(gap('LOOSE')).toBe('gap-4');
      expect(gap('RELAXED')).toBe('gap-6');
    });
  });

  describe('container()', () => {
    it('deve retornar a classe correta', () => {
      expect(container('SM')).toBe('px-4 py-3');
      expect(container('DEFAULT')).toBe('px-6 py-4');
      expect(container('LG')).toBe('px-8 py-6');
    });
  });

  describe('paddingX()', () => {
    it('deve retornar a classe correta', () => {
      expect(paddingX('SM')).toBe('px-2');
      expect(paddingX('DEFAULT')).toBe('px-4');
      expect(paddingX('MD')).toBe('px-6');
      expect(paddingX('LG')).toBe('px-8');
    });
  });

  describe('paddingY()', () => {
    it('deve retornar a classe correta', () => {
      expect(paddingY('SM')).toBe('py-2');
      expect(paddingY('DEFAULT')).toBe('py-4');
      expect(paddingY('MD')).toBe('py-6');
      expect(paddingY('LG')).toBe('py-8');
    });
  });

  describe('padding()', () => {
    it('deve combinar padding horizontal e vertical', () => {
      expect(padding('MD', 'DEFAULT')).toBe('px-6 py-4');
      expect(padding('DEFAULT', 'SM')).toBe('px-4 py-2');
      expect(padding('LG', 'MD')).toBe('px-8 py-6');
    });

    it('deve corresponder aos valores de CONTAINER', () => {
      expect(padding('DEFAULT', 'SM')).toBe('px-4 py-2');
      expect(padding('MD', 'DEFAULT')).toBe('px-6 py-4');
      expect(padding('LG', 'MD')).toBe('px-8 py-6');
    });
  });

  describe('marginTop()', () => {
    it('deve retornar a classe correta', () => {
      expect(marginTop('SM')).toBe('mt-2');
      expect(marginTop('DEFAULT')).toBe('mt-4');
      expect(marginTop('MD')).toBe('mt-6');
      expect(marginTop('LG')).toBe('mt-8');
    });
  });

  describe('marginBottom()', () => {
    it('deve retornar a classe correta', () => {
      expect(marginBottom('SM')).toBe('mb-2');
      expect(marginBottom('DEFAULT')).toBe('mb-4');
      expect(marginBottom('MD')).toBe('mb-6');
      expect(marginBottom('LG')).toBe('mb-8');
    });
  });

  describe('Hierarquia de tamanhos', () => {
    it('STACK deve seguir hierarquia crescente', () => {
      const tight = parseInt(STACK.TIGHT.replace('space-y-', ''));
      const def = parseInt(STACK.DEFAULT.replace('space-y-', ''));
      const loose = parseInt(STACK.LOOSE.replace('space-y-', ''));
      const relaxed = parseInt(STACK.RELAXED.replace('space-y-', ''));

      expect(tight).toBeLessThan(def);
      expect(def).toBeLessThan(loose);
      expect(loose).toBeLessThan(relaxed);
    });

    it('GAP deve seguir hierarquia crescente', () => {
      const tight = parseInt(GAP.TIGHT.replace('gap-', ''));
      const def = parseInt(GAP.DEFAULT.replace('gap-', ''));
      const loose = parseInt(GAP.LOOSE.replace('gap-', ''));
      const relaxed = parseInt(GAP.RELAXED.replace('gap-', ''));

      expect(tight).toBeLessThan(def);
      expect(def).toBeLessThan(loose);
      expect(loose).toBeLessThan(relaxed);
    });
  });

  describe('Consistência entre tokens', () => {
    it('STACK.TIGHT e GAP.TIGHT devem usar o mesmo valor base', () => {
      expect(STACK.TIGHT).toContain('2');
      expect(GAP.TIGHT).toContain('2');
    });

    it('STACK.DEFAULT e GAP.LOOSE devem usar valores próximos', () => {
      const stackValue = parseInt(STACK.DEFAULT.replace('space-y-', ''));
      const gapValue = parseInt(GAP.LOOSE.replace('gap-', ''));
      expect(stackValue).toBe(gapValue);
    });
  });

  describe('Valores de CONTAINER', () => {
    it('CONTAINER.DEFAULT deve usar px-6 py-4', () => {
      expect(CONTAINER.DEFAULT).toBe('px-6 py-4');
    });

    it('CONTAINER deve seguir hierarquia crescente', () => {
      // SM: px-4 py-3
      // DEFAULT: px-6 py-4
      // LG: px-8 py-6
      expect(CONTAINER.SM).toContain('px-4');
      expect(CONTAINER.DEFAULT).toContain('px-6');
      expect(CONTAINER.LG).toContain('px-8');
    });
  });
});
