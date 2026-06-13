export type Unsubscribe = () => void;

export class TypedEvent<T> {
  private readonly handlers = new Set<(payload: T) => void>();

  subscribe(handler: (payload: T) => void): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(payload: T): void {
    for (const handler of this.handlers) {
      handler(payload);
    }
  }
}
