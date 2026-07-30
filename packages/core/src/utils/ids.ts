export interface StableIdFactory {
  create(base: string): string
}

export function createStableIdFactory(): StableIdFactory {
  const occurrences = new Map<string, number>()

  return {
    create(base: string) {
      const occurrence = occurrences.get(base) ?? 0
      occurrences.set(base, occurrence + 1)
      return occurrence === 0 ? base : `${base}:${occurrence + 1}`
    },
  }
}
