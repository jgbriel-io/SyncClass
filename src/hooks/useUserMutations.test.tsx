/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCreateUser,
  useUpdateUserRole,
  useDeleteUser,
  useResetPassword,
  useUploadAvatar,
} from "./useUserMutations";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client");
vi.mock("sonner", () => ({
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

describe("useUserMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // inviteUserService calls getSession() before invoking edge function
    vi.mocked(supabase.auth).getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: "mock-token" } },
      error: null,
    });
  });

  describe("useCreateUser", () => {
    it("deve lidar com erro de email duplicado", async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { error: "Email já cadastrado" },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: "duplicate@test.com",
        password: "Test@123",
        fullName: "Test User",
        role: "admin",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it("deve aplicar rate limiting", async () => {
      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(),
      });

      // Simular múltiplas tentativas rápidas
      for (let i = 0; i < 6; i++) {
        result.current.mutate({
          email: `test${i}@test.com`,
          password: "Test@123",
          fullName: "Test User",
          role: "student",
        });
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain("Muitas tentativas");
      });
    });
  });

  describe("useUpdateUserRole", () => {
    it("deve ter a função de atualizar role", () => {
      const { result } = renderHook(() => useUpdateUserRole(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBeDefined();
    });
  });

  describe("useDeleteUser", () => {
    it("deve fazer soft delete do usuário preservando vínculos", async () => {
      const mockProfile = {
        student_id: "student-123",
        teacher_id: null,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });

      // Mock para buscar profile atual
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      // Mock para atualizar profile
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEqUpdate,
      } as any);

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("user-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockUpdate).toHaveBeenCalledWith({
        active: false,
        student_id: "student-123",
        teacher_id: null,
      });
      expect(mockEqUpdate).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("useResetPassword", () => {
    it("deve redefinir senha via Edge Function", async () => {
      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      vi.mocked(supabase.auth).getSession = mockGetSession;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        userId: "user-123",
        password: "NewPassword@123",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(global.fetch).toHaveBeenCalled();
    });

    it("deve lidar com sessão expirada", async () => {
      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: new Error("Session expired"),
      });

      vi.mocked(supabase.auth).getSession = mockGetSession;

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        userId: "user-123",
        password: "NewPassword@123",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain("Sessão expirada");
    });
  });

  describe("useUploadAvatar", () => {
    it("deve aplicar rate limiting em uploads", async () => {
      const mockFile = new File(["test"], "avatar.jpg", { type: "image/jpeg" });

      const { result } = renderHook(() => useUploadAvatar(), {
        wrapper: createWrapper(),
      });

      // Simular múltiplos uploads rápidos
      for (let i = 0; i < 6; i++) {
        result.current.mutate({
          userId: "user-123",
          file: mockFile,
        });
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain("Muitos uploads");
      });
    });
  });
});
