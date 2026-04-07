declare module "vitest" {
  export function afterEach(fn: () => void): void;
  export function describe(name: string, fn: () => void): void;
  export function expect<T>(value: T): {
    not: {
      toHaveBeenCalled(): void;
      toHaveBeenCalledWith(...args: unknown[]): void;
      toHaveBeenCalledTimes(expected: number): void;
      toBe(expected: unknown): void;
      toBeDefined(): void;
      toBeUndefined(): void;
    };
    toBe(expected: unknown): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
    toHaveBeenCalledTimes(expected: number): void;
    toEqual(expected: unknown): void;
    toMatchObject(expected: Record<string, unknown>): void;
  };
  export function it(name: string, fn: () => void): void;
  export const vi: {
    clearAllMocks(): void;
    fn<TArgs extends unknown[] = unknown[], TResult = unknown>(
      impl?: (...args: TArgs) => TResult,
    ): ((...args: TArgs) => TResult) & {
      mock: { calls: TArgs[] };
      mockClear(): void;
      mockReturnValue(value: TResult): void;
    };
    hoisted<T>(factory: () => T): T;
    importActual<T>(moduleName: string): Promise<T>;
    mock(moduleName: string, factory: () => unknown): void;
    spyOn<T extends object, K extends keyof T>(object: T, key: K): { mockReturnValue(value: unknown): void };
    restoreAllMocks(): void;
  };
}
