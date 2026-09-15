export type Clock = {
  now(): Date;
};

export const systemClock: Clock = {
  now() {
    return new Date();
  },
};

export function toIso(date: Date): string {
  return date.toISOString();
}

export function fromIso(value: string): Date {
  return new Date(value);
}

export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}
