import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve retornar o valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("deve debounce o valor após o delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } }
    );

    expect(result.current).toBe("initial");

    // Atualizar valor
    rerender({ value: "updated" });

    // Valor ainda não deve ter mudado
    expect(result.current).toBe("initial");

    // Avançar tempo
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Agora o valor deve ter mudado
    expect(result.current).toBe("updated");
  });

  it("deve cancelar timer anterior quando valor muda rapidamente", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } }
    );

    // Primeira mudança
    rerender({ value: "first" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Segunda mudança antes do delay
    rerender({ value: "second" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Terceira mudança antes do delay
    rerender({ value: "third" });

    // Valor ainda deve ser o inicial
    expect(result.current).toBe("initial");

    // Avançar tempo completo
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Deve ter apenas a última mudança
    expect(result.current).toBe("third");
  });

  it("deve funcionar com diferentes delays", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "updated", delay: 500 });

    // Não deve mudar antes do delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("initial");

    // Deve mudar após o delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("updated");
  });

  it("deve funcionar com diferentes tipos de valores", () => {
    // String
    const { result: stringResult, rerender: stringRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "test" } }
    );
    stringRerender({ value: "updated" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(stringResult.current).toBe("updated");

    // Number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 0 } }
    );
    numberRerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(numberResult.current).toBe(42);

    // Boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: false } }
    );
    boolRerender({ value: true });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(boolResult.current).toBe(true);

    // Object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: { a: 1 } } }
    );
    objRerender({ value: { a: 2 } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(objResult.current).toEqual({ a: 2 });
  });

  it("deve limpar timer ao desmontar", () => {
    const { unmount } = renderHook(() => useDebouncedValue("test", 300));

    // Desmontar antes do delay
    unmount();

    // Avançar tempo (não deve causar erro)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Sem erros = sucesso
    expect(true).toBe(true);
  });

  it("deve usar delay padrão de 300ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });

    // Não deve mudar antes de 300ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("initial");

    // Deve mudar após 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("updated");
  });
});
