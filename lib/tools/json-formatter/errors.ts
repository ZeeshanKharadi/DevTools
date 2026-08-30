export type LineColumn = {
  line: number;
  column: number;
};

export type LocatedJsonError = LineColumn & {
  index: number;
  detail: string;
};

class LocateError extends Error {
  constructor(
    message: string,
    readonly index: number,
  ) {
    super(message);
  }
}

export function positionToLineColumn(
  input: string,
  index: number,
): LineColumn {
  let line = 1;
  let column = 1;
  const end = Math.max(0, Math.min(index, input.length));

  for (let i = 0; i < end; i += 1) {
    const char = input[i];

    if (char === "\n") {
      line += 1;
      column = 1;
    } else if (char === "\r") {
      if (input[i + 1] !== "\n") {
        line += 1;
        column = 1;
      }
    } else {
      column += 1;
    }
  }

  return { line, column };
}

export function sanitizeJsonErrorMessage(raw: string): string {
  const cleaned = raw
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/\s+in JSON at position \d+/i, "")
    .replace(/\s*\(line \d+ column \d+\)/i, "")
    .replace(/\s+of the JSON data$/i, "")
    .trim();

  return cleaned || "The JSON could not be parsed.";
}

function extractLineColumnFromMessage(raw: string): LineColumn | null {
  const lineColumn = raw.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (!lineColumn) {
    return null;
  }

  return {
    line: Number(lineColumn[1]),
    column: Number(lineColumn[2]),
  };
}

function extractPositionFromMessage(raw: string): number | null {
  const position = raw.match(/position\s+(\d+)/i);
  return position ? Number(position[1]) : null;
}

class JsonLocator {
  private index = 0;

  constructor(private readonly input: string) {}

  parseDocument() {
    this.skipWhitespace();
    this.parseValue();
    this.skipWhitespace();

    if (!this.isAtEnd()) {
      throw new LocateError("Unexpected extra content after JSON value.", this.index);
    }
  }

  private parseValue() {
    this.skipWhitespace();
    const char = this.peek();

    if (char === undefined) {
      throw new LocateError("Unexpected end of JSON input.", this.index);
    }

    if (char === "{") {
      this.parseObject();
      return;
    }

    if (char === "[") {
      this.parseArray();
      return;
    }

    if (char === '"') {
      this.parseString();
      return;
    }

    if (char === "-" || this.isDigit(char)) {
      this.parseNumber();
      return;
    }

    if (char === "t") {
      this.expectLiteral("true");
      return;
    }

    if (char === "f") {
      this.expectLiteral("false");
      return;
    }

    if (char === "n") {
      this.expectLiteral("null");
      return;
    }

    throw new LocateError(`Unexpected token "${char}".`, this.index);
  }

  private parseObject() {
    this.consume("{");
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.consume("}");
      return;
    }

    while (true) {
      this.skipWhitespace();

      if (this.peek() !== '"') {
        throw new LocateError("Expected a string key.", this.index);
      }

      this.parseString();
      this.skipWhitespace();
      this.expect(":");
      this.parseValue();
      this.skipWhitespace();

      if (this.peek() === ",") {
        this.consume(",");
        this.skipWhitespace();

        if (this.peek() === "}") {
          throw new LocateError("Trailing comma in object.", this.index);
        }

        continue;
      }

      if (this.peek() === "}") {
        this.consume("}");
        return;
      }

      throw new LocateError("Expected comma or closing brace.", this.index);
    }
  }

  private parseArray() {
    this.consume("[");
    this.skipWhitespace();

    if (this.peek() === "]") {
      this.consume("]");
      return;
    }

    while (true) {
      this.parseValue();
      this.skipWhitespace();

      if (this.peek() === ",") {
        this.consume(",");
        this.skipWhitespace();

        if (this.peek() === "]") {
          throw new LocateError("Trailing comma in array.", this.index);
        }

        continue;
      }

      if (this.peek() === "]") {
        this.consume("]");
        return;
      }

      throw new LocateError("Expected comma or closing bracket.", this.index);
    }
  }

  private parseString() {
    this.consume('"');

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === '"') {
        this.advance();
        return;
      }

      if (char === "\\") {
        this.advance();
        this.parseEscape();
        continue;
      }

      if (char && char.charCodeAt(0) < 0x20) {
        throw new LocateError("Unescaped control character in string.", this.index);
      }

      this.advance();
    }

    throw new LocateError("Unterminated string.", this.index);
  }

  private parseEscape() {
    const char = this.peek();

    if (char === undefined) {
      throw new LocateError("Unterminated string escape.", this.index);
    }

    if ('"\\/bfnrt'.includes(char)) {
      this.advance();
      return;
    }

    if (char === "u") {
      this.advance();

      for (let i = 0; i < 4; i += 1) {
        const hex = this.peek();

        if (!hex || !/[0-9a-fA-F]/.test(hex)) {
          throw new LocateError("Invalid Unicode escape.", this.index);
        }

        this.advance();
      }

      return;
    }

    throw new LocateError("Invalid escape sequence.", this.index);
  }

  private parseNumber() {
    if (this.peek() === "-") {
      this.advance();
    }

    const first = this.peek();

    if (first === undefined || !this.isDigit(first)) {
      throw new LocateError("Invalid number.", this.index);
    }

    if (first === "0") {
      this.advance();
    } else {
      while (this.peek() !== undefined && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    if (this.peek() === ".") {
      this.advance();

      if (!this.isDigit(this.peek())) {
        throw new LocateError("Invalid number.", this.index);
      }

      while (this.peek() !== undefined && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const exponent = this.peek();

    if (exponent === "e" || exponent === "E") {
      this.advance();

      if (this.peek() === "+" || this.peek() === "-") {
        this.advance();
      }

      if (!this.isDigit(this.peek())) {
        throw new LocateError("Invalid number.", this.index);
      }

      while (this.peek() !== undefined && this.isDigit(this.peek())) {
        this.advance();
      }
    }
  }

  private expectLiteral(literal: string) {
    for (const char of literal) {
      if (this.peek() !== char) {
        throw new LocateError(`Unexpected token "${this.peek() ?? "end"}".`, this.index);
      }

      this.advance();
    }
  }

  private expect(char: string) {
    if (this.peek() !== char) {
      throw new LocateError(`Expected "${char}".`, this.index);
    }

    this.advance();
  }

  private consume(char: string) {
    this.expect(char);
  }

  private skipWhitespace() {
    while (!this.isAtEnd() && this.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  private peek(): string | undefined {
    return this.input[this.index];
  }

  private advance() {
    this.index += 1;
  }

  private isAtEnd() {
    return this.index >= this.input.length;
  }

  private isDigit(char: string | undefined) {
    return char !== undefined && char >= "0" && char <= "9";
  }

  private isWhitespace(char: string | undefined) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }
}

export function locateJsonSyntaxError(input: string): LocatedJsonError | null {
  try {
    new JsonLocator(input).parseDocument();
    return null;
  } catch (error) {
    if (error instanceof LocateError) {
      const { line, column } = positionToLineColumn(input, error.index);
      return {
        index: error.index,
        line,
        column,
        detail: error.message,
      };
    }

    return null;
  }
}

export function describeJsonError(
  input: string,
  error: unknown,
): {
  message: string;
  line: number | null;
  column: number | null;
} {
  const raw = error instanceof Error ? error.message : "Invalid JSON";
  const message = sanitizeJsonErrorMessage(raw);
  const fromMessage = extractLineColumnFromMessage(raw);

  if (fromMessage) {
    return { message, ...fromMessage };
  }

  const position = extractPositionFromMessage(raw);

  if (position !== null) {
    const { line, column } = positionToLineColumn(input, position);
    return { message, line, column };
  }

  const located = locateJsonSyntaxError(input);

  if (located) {
    return {
      message,
      line: located.line,
      column: located.column,
    };
  }

  return { message, line: null, column: null };
}
