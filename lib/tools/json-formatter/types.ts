export type JsonSuccess<T> = {
  ok: true;
} & T;

export type JsonError = {
  ok: false;
  message: string;
  line: number | null;
  column: number | null;
};

export type JsonParseResult =
  | JsonSuccess<{ value: unknown }>
  | JsonError;

export type JsonProcessResult = JsonSuccess<{ output: string }> | JsonError;
