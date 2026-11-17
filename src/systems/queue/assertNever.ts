/** Closes a `switch` over a union: the compiler proves every case is handled. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
