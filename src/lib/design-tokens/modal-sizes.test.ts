import { describe, it, expect } from 'vitest';
import {
  DIALOG_SIZES,
  SHEET_SIZES,
  DIALOG_SIZE_MAP,
  SHEET_SIZE_MAP,
  MODAL_SIZES_PX,
  getDialogSizeClass,
  getSheetSizeClass,
  getDialogSizePx,
  getSheetSizePx,
} from './modal-sizes';

describe('Design Tokens: Modal Sizes', () => {
  describe('DIALOG_SIZES', () => {
    it('deve ter 3 tamanhos definidos', () => {
      expect(Object.keys(DIALOG_SIZES)).toHaveLength(3);
    });

    it('deve ter os tamanhos corretos', () => {
      expect(DIALOG_SIZES.SM).toBe('sm:max-w-md');
      expect(DIALOG_SIZES.MD).toBe('sm:max-w-lg');
      expect(DIALOG_SIZES.LG).toBe('sm:max-w-2xl');
    });
  });

  describe('SHEET_SIZES', () => {
    it('deve ter 4 tamanhos definidos', () => {
      expect(Object.keys(SHEET_SIZES)).toHaveLength(4);
    });

    it('deve ter os tamanhos corretos', () => {
      expect(SHEET_SIZES.DEFAULT).toBe('sm:max-w-lg');
      expect(SHEET_SIZES.LG).toBe('sm:max-w-xl');
      expect(SHEET_SIZES.XL).toBe('sm:max-w-2xl');
      expect(SHEET_SIZES.FULL).toBe('sm:max-w-full');
    });
  });

  describe('DIALOG_SIZE_MAP', () => {
    it('deve mapear corretamente os tamanhos', () => {
      expect(DIALOG_SIZE_MAP.SM).toBe(DIALOG_SIZES.SM);
      expect(DIALOG_SIZE_MAP.MD).toBe(DIALOG_SIZES.MD);
      expect(DIALOG_SIZE_MAP.LG).toBe(DIALOG_SIZES.LG);
    });
  });

  describe('SHEET_SIZE_MAP', () => {
    it('deve mapear corretamente os tamanhos', () => {
      expect(SHEET_SIZE_MAP.DEFAULT).toBe(SHEET_SIZES.DEFAULT);
      expect(SHEET_SIZE_MAP.LG).toBe(SHEET_SIZES.LG);
      expect(SHEET_SIZE_MAP.XL).toBe(SHEET_SIZES.XL);
      expect(SHEET_SIZE_MAP.FULL).toBe(SHEET_SIZES.FULL);
    });
  });

  describe('MODAL_SIZES_PX', () => {
    it('deve ter valores em pixels corretos para Dialogs', () => {
      expect(MODAL_SIZES_PX.DIALOG_SM).toBe(448);
      expect(MODAL_SIZES_PX.DIALOG_MD).toBe(512);
      expect(MODAL_SIZES_PX.DIALOG_LG).toBe(672);
    });

    it('deve ter valores em pixels corretos para Sheets', () => {
      expect(MODAL_SIZES_PX.SHEET_DEFAULT).toBe(512);
      expect(MODAL_SIZES_PX.SHEET_LG).toBe(640);
      expect(MODAL_SIZES_PX.SHEET_XL).toBe(672);
    });
  });

  describe('getDialogSizeClass', () => {
    it('deve retornar a classe correta para cada tamanho', () => {
      expect(getDialogSizeClass('SM')).toBe('sm:max-w-md');
      expect(getDialogSizeClass('MD')).toBe('sm:max-w-lg');
      expect(getDialogSizeClass('LG')).toBe('sm:max-w-2xl');
    });
  });

  describe('getSheetSizeClass', () => {
    it('deve retornar a classe correta para cada tamanho', () => {
      expect(getSheetSizeClass('DEFAULT')).toBe('sm:max-w-lg');
      expect(getSheetSizeClass('LG')).toBe('sm:max-w-xl');
      expect(getSheetSizeClass('XL')).toBe('sm:max-w-2xl');
      expect(getSheetSizeClass('FULL')).toBe('sm:max-w-full');
    });
  });

  describe('getDialogSizePx', () => {
    it('deve retornar o valor em pixels correto', () => {
      expect(getDialogSizePx('SM')).toBe(448);
      expect(getDialogSizePx('MD')).toBe(512);
      expect(getDialogSizePx('LG')).toBe(672);
    });
  });

  describe('getSheetSizePx', () => {
    it('deve retornar o valor em pixels correto', () => {
      expect(getSheetSizePx('DEFAULT')).toBe(512);
      expect(getSheetSizePx('LG')).toBe(640);
      expect(getSheetSizePx('XL')).toBe(672);
    });

    it('deve retornar null para FULL', () => {
      expect(getSheetSizePx('FULL')).toBeNull();
    });
  });

  describe('Consistência entre Dialogs e Sheets', () => {
    it('DIALOG_MD e SHEET_DEFAULT devem ter o mesmo tamanho', () => {
      expect(MODAL_SIZES_PX.DIALOG_MD).toBe(MODAL_SIZES_PX.SHEET_DEFAULT);
    });

    it('DIALOG_LG e SHEET_XL devem ter o mesmo tamanho', () => {
      expect(MODAL_SIZES_PX.DIALOG_LG).toBe(MODAL_SIZES_PX.SHEET_XL);
    });
  });
});
