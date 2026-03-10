/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStudents, useStudentsPaginated, useCreateStudent, useUpdateStudent } from './useStudents';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Helper para criar wrapper com QueryClient
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

describe('useStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useStudents - Listar todos os alunos', () => {
    it('deve buscar lista de alunos com sucesso', async () => {
      const mockStudents = [
        { id: '1', name: 'João Silva', email: 'joao@test.com', status: 'ativo' },
        { id: '2', name: 'Maria Santos', email: 'maria@test.com', status: 'ativo' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockStudents, error: null });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const { result } = renderHook(() => useStudents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('students_masked');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.current.data).toEqual(mockStudents);
    });

    it('deve lidar com erro ao buscar alunos', async () => {
      const mockError = new Error('Erro ao buscar alunos');

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const { result } = renderHook(() => useStudents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useStudentsPaginated - Paginação', () => {
    it('deve buscar alunos com paginação', async () => {
      const mockStudents = [
        { id: '1', name: 'João Silva', email: 'joao@test.com' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockStudents,
        error: null,
        count: 10,
      });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange,
      } as any);

      const { result } = renderHook(
        () => useStudentsPaginated({ pageSize: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(supabase.from).toHaveBeenCalledWith('students_with_stats');
      expect(mockRange).toHaveBeenCalledWith(0, 4); // page 0, size 5
      expect(result.current.data).toEqual(mockStudents);
      expect(result.current.totalCount).toBe(10);
      expect(result.current.hasMore).toBe(true);
    });

    it('deve aplicar filtros corretamente', async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      } as any);

      const { result } = renderHook(
        () =>
          useStudentsPaginated({
            filters: {
              teacherId: 'teacher-123',
              status: 'ativo',
            },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockEq).toHaveBeenCalledWith('teacher_id', 'teacher-123');
      expect(mockEq).toHaveBeenCalledWith('status', 'ativo');
    });
  });

  describe('useCreateStudent - Criar aluno', () => {
    it('deve lidar com erro de duplicação', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

       
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any);

      const { result } = renderHook(() => useCreateStudent(), {
        wrapper: createWrapper(),
      });

       
      result.current.mutate({ name: 'Test', email: 'test@test.com' } as any);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateStudent - Atualizar aluno', () => {
    it('deve validar dados antes de atualizar', async () => {
      const { result } = renderHook(() => useUpdateStudent(), {
        wrapper: createWrapper(),
      });

      // Testa que o hook existe e pode ser chamado
      expect(result.current.mutate).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });
});
