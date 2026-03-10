import { describe, it, expect } from 'vitest';
import {
  TABLE_COLUMN_SIZES,
  getColumnStyle,
  getXLColumnClasses,
  calculateTableMinWidth,
} from './table-columns';

describe('table-columns design tokens', () => {
  describe('TABLE_COLUMN_SIZES', () => {
    it('should have correct T-Shirt sizes', () => {
      expect(TABLE_COLUMN_SIZES.XL).toBe(280);
      expect(TABLE_COLUMN_SIZES.XL_DESKTOP).toBe(360);
      expect(TABLE_COLUMN_SIZES.L).toBe(240);
      expect(TABLE_COLUMN_SIZES.M).toBe(140);
      expect(TABLE_COLUMN_SIZES.S).toBe(110);
      expect(TABLE_COLUMN_SIZES.XS).toBe(90);
    });
  });

  describe('getColumnStyle', () => {
    it('should return correct style for non-XL columns', () => {
      const style = getColumnStyle('M');
      expect(style).toEqual({
        width: 140,
        minWidth: 140,
      });
    });

    it('should return correct style for XL column', () => {
      const style = getColumnStyle('XL');
      expect(style).toEqual({
        width: 280,
        minWidth: 280,
      });
    });

    it('should handle responsive XL column', () => {
      const style = getColumnStyle('XL', true);
      expect(style).toEqual({
        width: 280,
        minWidth: 280,
      });
    });
  });

  describe('getXLColumnClasses', () => {
    it('should return correct Tailwind classes', () => {
      const classes = getXLColumnClasses();
      expect(classes).toContain('w-[280px]');
      expect(classes).toContain('min-w-[280px]');
      expect(classes).toContain('desktop:w-[360px]');
    });
  });

  describe('calculateTableMinWidth', () => {
    it('should calculate correct total width', () => {
      const width = calculateTableMinWidth(['XL', 'L', 'M', 'S', 'XS']);
      expect(width).toBe(280 + 240 + 140 + 110 + 90); // 860
    });

    it('should handle single column', () => {
      const width = calculateTableMinWidth(['M']);
      expect(width).toBe(140);
    });

    it('should handle empty array', () => {
      const width = calculateTableMinWidth([]);
      expect(width).toBe(0);
    });
  });
});
