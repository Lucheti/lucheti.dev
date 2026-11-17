/** Closes a `switch` over a union: TypeScript fails the build if a member is left unhandled. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}
