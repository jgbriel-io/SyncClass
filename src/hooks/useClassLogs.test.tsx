/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useClassLogs,
  useCreateClassLog,
  useUpdateClassLog,
  useDeleteClassLog,
  useCreateClassLogPackage,
} from './useClassLogs';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useClassLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useClassLogs - Listar aulas', () => {
    it('deve ter a função de buscar aulas', () => {
      const { result } = renderHook(() => useClassLogs(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe('useCreateClassLog - Criar aula', () => {
    it('deve criar aula individual com sucesso', async () => {
      const newClass = {
        student_id: 'student-1',
        teacher_id: 'teacher-1',
        class_date: '2026-02-16',
        start_at: '10:00',
        end_at: '11:00',
        attendance: true,
        billed_amount: 100,
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'new-class-id', ...newClass },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any);  

      const { result } = renderHook(() => useCreateClassLog(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newClass as any);  

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('class_logs');
      expect(mockInsert).toHaveBeenCalledWith(newClass);
    });

    it('deve validar conflito de horário', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'conflito de horário',
        },
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any);  

      const { result } = renderHook(() => useCreateClassLog(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        student_id: 'student-1',
        teacher_id: 'teacher-1',
        class_date: '2026-02-16',
        start_at: '10:00',
        end_at: '11:00',
      } as any);  

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreateClassLogPackage - Criar pacote de aulas', () => {
    it('deve ter a função de criar pacote', () => {
      const { result } = renderHook(() => useCreateClassLogPackage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBeDefined();
    });
  });

  describe('useUpdateClassLog - Atualizar aula', () => {
    it('deve ter a função de atualizar aula', () => {
      const { result } = renderHook(() => useUpdateClassLog(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBeDefined();
    });
  });

  describe('useDeleteClassLog - Deletar aula', () => {
    it('deve deletar aula se não estiver em pacote', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      } as any);  

      const { result } = renderHook(() => useDeleteClassLog(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('class-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('class_logs');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'class-123');
    });

    it('deve impedir deleção de aula em pacote', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        error: {
          code: '23503',
          message: 'violates foreign key constraint',
        },
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      } as any);

      const { result } = renderHook(() => useDeleteClassLog(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('class-123');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
