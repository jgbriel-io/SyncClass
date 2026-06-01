import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useOptimisticMutation,
  useRetryMutation,
} from "./useOptimisticMutation";
import React from "react";

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useOptimisticMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve executar mutação com sucesso", async () => {
    const mutationFn = vi
      .fn()
      .mockResolvedValue({ id: "1", status: "success" });
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          queryKey: ["test"],
          successMessage: "Sucesso!",
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mutationFn).toHaveBeenCalledWith("test-data");
    expect(onSuccess).toHaveBeenCalled();
  });

  it("deve aplicar optimistic update", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["test"], [{ id: "1", status: "pending" }]);

    const mutationFn = vi
      .fn()
      .mockResolvedValue({ id: "1", status: "completed" });
    const optimisticUpdate = vi.fn((oldData, variables) => {
      return oldData.map((item: { id: string; status: string }) =>
        item.id === variables ? { ...item, status: "completed" } : item
      );
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          queryKey: ["test"],
          optimisticUpdate,
        }),
      { wrapper }
    );

    result.current.mutate("1");

    await waitFor(() => {
      expect(optimisticUpdate).toHaveBeenCalled();
    });
  });

  it("deve reverter em caso de erro", async () => {
    const queryClient = new QueryClient();
    const initialData = [{ id: "1", status: "pending" }];
    queryClient.setQueryData(["test"], initialData);

    const mutationFn = vi.fn().mockRejectedValue(new Error("Erro de teste"));
    const optimisticUpdate = vi.fn((oldData) => {
      return oldData.map((item: { id: string; status: string }) => ({
        ...item,
        status: "completed",
      }));
    });
    const onError = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          queryKey: ["test"],
          optimisticUpdate,
          errorMessage: "Erro!",
          onError,
        }),
      { wrapper }
    );

    result.current.mutate("1");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
    // Dados devem ser revertidos
    expect(queryClient.getQueryData(["test"])).toEqual(initialData);
  });

  it("deve fazer retry quando configurado", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Erro 1"))
      .mockRejectedValueOnce(new Error("Erro 2"))
      .mockResolvedValue({ id: "1", status: "success" });

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          queryKey: ["test"],
          retry: 2,
          retryDelay: 100,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(mutationFn).toHaveBeenCalledTimes(3);
  });
});

describe("useRetryMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve executar mutação com sucesso", async () => {
    const mutationFn = vi
      .fn()
      .mockResolvedValue({ id: "1", status: "success" });
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useRetryMutation({
          mutationFn,
          queryKey: ["test"],
          successMessage: "Sucesso!",
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mutationFn).toHaveBeenCalledWith("test-data");
    expect(onSuccess).toHaveBeenCalled();
  });

  it("deve fazer retry com backoff exponencial", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Erro 1"))
      .mockRejectedValueOnce(new Error("Erro 2"))
      .mockResolvedValue({ id: "1", status: "success" });

    const { result } = renderHook(
      () =>
        useRetryMutation({
          mutationFn,
          queryKey: ["test"],
          maxRetries: 3,
          initialDelay: 100,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(mutationFn).toHaveBeenCalledTimes(3);
  });

  it("deve falhar após máximo de retries", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Erro persistente"));
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useRetryMutation({
          mutationFn,
          queryKey: ["test"],
          maxRetries: 2,
          initialDelay: 100,
          errorMessage: "Erro!",
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(mutationFn).toHaveBeenCalledTimes(3); // 1 tentativa inicial + 2 retries
    expect(onError).toHaveBeenCalled();
  });

  it("deve detectar erro de rede", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useRetryMutation({
          mutationFn,
          queryKey: ["test"],
          maxRetries: 0,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.mutate("test-data");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });
});
