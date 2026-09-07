interface CacheEntry<Value> {
  value: Value;
  expiresAt: number;
}

export class TtlCache<Value> {
  private readonly store = new Map<string, CacheEntry<Value>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): Value | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: Value): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
