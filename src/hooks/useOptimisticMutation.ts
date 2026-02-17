import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook para mutações com optimistic updates
 * Atualiza a UI imediatamente e reverte em caso de erro
 * 
 * @example
 * const markAsPaid = useOptimisticMutation({
 *   mutationFn: async (id: string) => {
 *     await supabase.from("financial_records").update({ status: "pago" }).eq("id", id);
 *   },
 *   queryKey: ["financial_records"],
 *   optimisticUpdate: (oldData, id) => {
 *     return oldData.map(record => 
 *       record.id === id ? { ...record, status: "pago" } : record
 *     );
 *   },
 *   successMessage: "Pagamento registrado!",
 *   errorMessage: "Erro ao marcar como pago"
 * });
 */

interface UseOptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  /** Função de mutação (async) */
  mutationFn: (variables: TVariables) => Promise<TData>;
  
  /** Query key para invalidar/atualizar */
  queryKey: unknown[];
  
  /** Função para atualizar dados otimisticamente */
  optimisticUpdate?: (oldData: unknown, variables: TVariables) => unknown;
  
  /** Mensagem de sucesso (opcional) */
  successMessage?: string;
  
  /** Mensagem de erro (opcional) */
  errorMessage?: string;
  
  /** Callback adicional de sucesso */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  
  /** Callback adicional de erro */
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  
  /** Retry automático (padrão: 0) */
  retry?: number;
  
  /** Delay entre retries em ms (padrão: 1000) */
  retryDelay?: number;
}

export function useOptimisticMutation<TData = unknown, TVariables = void, TContext = unknown>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  retry = 0,
  retryDelay = 1000,
}: UseOptimisticMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    retry,
    retryDelay,
    
    onMutate: async (variables) => {
      if (!optimisticUpdate) return;

      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey });

      // Snapshot do estado anterior
      const previousData = queryClient.getQueryData(queryKey);

      // Atualizar otimisticamente
      if (previousData) {
        const newData = optimisticUpdate(previousData, variables);
        queryClient.setQueryData(queryKey, newData);
      }

      // Retornar contexto para rollback
      return { previousData } as TContext;
    },

    onError: (error, variables, context) => {
      // Reverter para estado anterior
      if (context && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: unknown }).previousData);
      }

      // Mostrar mensagem de erro
      if (errorMessage) {
        toast.error(errorMessage);
      }

      // Callback adicional
      if (onError) {
        onError(error, variables, context);
      }
    },

    onSuccess: (data, variables, context) => {
      // Mostrar mensagem de sucesso
      if (successMessage) {
        toast.success(successMessage);
      }

      // Callback adicional
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },

    onSettled: () => {
      // Invalidar queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook para mutações com retry automático e backoff exponencial
 * Útil para operações que podem falhar temporariamente (rede, etc.)
 * 
 * @example
 * const createRecord = useRetryMutation({
 *   mutationFn: async (data) => {
 *     await supabase.from("records").insert(data);
 *   },
 *   queryKey: ["records"],
 *   maxRetries: 3,
 *   successMessage: "Registro criado!"
 * });
 */

interface UseRetryMutationOptions<TData, TVariables> {
  /** Função de mutação (async) */
  mutationFn: (variables: TVariables) => Promise<TData>;
  
  /** Query key para invalidar */
  queryKey: unknown[];
  
  /** Número máximo de tentativas (padrão: 3) */
  maxRetries?: number;
  
  /** Delay inicial em ms (padrão: 1000) */
  initialDelay?: number;
  
  /** Mensagem de sucesso (opcional) */
  successMessage?: string;
  
  /** Mensagem de erro (opcional) */
  errorMessage?: string;
  
  /** Callback adicional de sucesso */
  onSuccess?: (data: TData, variables: TVariables) => void;
  
  /** Callback adicional de erro */
  onError?: (error: Error, variables: TVariables) => void;
}

export function useRetryMutation<TData = unknown, TVariables = void>({
  mutationFn,
  queryKey,
  maxRetries = 3,
  initialDelay = 1000,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: UseRetryMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    retry: maxRetries,
    retryDelay: (attemptIndex) => {
      // Backoff exponencial: 1s, 2s, 4s, 8s, ...
      const delay = Math.min(initialDelay * Math.pow(2, attemptIndex), 30000);
      return delay;
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },

    onError: (error, variables) => {
      const message = error.message?.toLowerCase().includes("network")
        ? "Erro de conexão. Tentando novamente..."
        : errorMessage || "Erro ao executar operação";
      
      toast.error(message);
      
      if (onError) {
        onError(error, variables);
      }
    },
  });
}
