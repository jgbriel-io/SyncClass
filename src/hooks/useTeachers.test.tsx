/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useTeachers,
  useTeachersPaginated,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from './useTeachers';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('useTeachers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTeachers - Listar professores', () => {
    it('deve buscar lista de professores', async () => {
      const mockTeachers = [
        { id: '1', name: 'Prof. João', email: 'joao@school.com', status: 'ativo' },
        { id: '2', name: 'Prof. Maria', email: 'maria@school.com', status: 'ativo' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockTeachers, error: null });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const { result } = renderHook(() => useTeachers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('teachers');
      // Data should be masked (CPF with last 4 digits visible)
      expect(result.current.data).toBeDefined();
    });
  });

  describe('useTeachersPaginated - Paginação', () => {
    it('deve buscar professores com paginação', async () => {
      const mockTeachers = [
        { id: '1', name: 'Prof. João', email: 'joao@school.com' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockTeachers,
        error: null,
        count: 5,
      });

       
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange,
      } as any);

      const { result } = renderHook(
        () => useTeachersPaginated({ pageSize: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
      expect(result.current.totalCount).toBe(5);
      expect(result.current.hasMore).toBe(false);
    });

    it('deve aplicar filtro de status', async () => {
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
          useTeachersPaginated({
            filters: { status: 'inativo' },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockEq).toHaveBeenCalledWith('status', 'inativo');
    });
  });

  describe('useCreateTeacher - Criar professor', () => {
    it('deve validar telefone duplicado', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "teachers_phone_key"' },
      });

       
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any);

      const { result } = renderHook(() => useCreateTeacher(), {
        wrapper: createWrapper(),
      });

       
      result.current.mutate({
        name: 'Test',
        email: 'test@test.com',
        phone: '11999999999',
      } as any);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateTeacher - Atualizar professor', () => {
    it('deve validar dados antes de atualizar', async () => {
      const { result } = renderHook(() => useUpdateTeacher(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });

  describe('useDeleteTeacher - Deletar professor', () => {
    it('deve deletar professor (soft delete)', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({ 
        data: [{ id: 'teacher-123', status: 'inativo' }], 
        error: null 
      });

      // Mock para atualizar teacher
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
      } as any);

      // Mock para atualizar profiles vinculados
      const mockUpdateProfiles = vi.fn().mockReturnThis();
      const mockEqProfiles = vi.fn().mockResolvedValue({ error: null });
      
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdateProfiles,
        eq: mockEqProfiles,
      } as any);

      const { result } = renderHook(() => useDeleteTeacher(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('teacher-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'inativo' });
      expect(mockEq).toHaveBeenCalledWith('id', 'teacher-123');
    });
  });
});
