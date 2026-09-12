export function toJson(value: unknown): string {
  return JSON.stringify(value);
}

export function fromJson<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error('Stored session data is malformed or incomplete.');
  }
}
