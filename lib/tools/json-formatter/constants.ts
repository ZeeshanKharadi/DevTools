export const MAX_JSON_INPUT_SIZE = 5 * 1024 * 1024;

export const WARN_JSON_INPUT_SIZE = Math.floor(MAX_JSON_INPUT_SIZE * 0.8);

export const JSON_FORMATTER_EXAMPLE = `{
  "user": {
    "id": 1001,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["developer", "admin"],
    "active": true
  }
}`;

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getJsonInputSizeWarning(input: string): string | null {
  const size = input.length;

  if (size >= MAX_JSON_INPUT_SIZE) {
    return `This input is ${formatByteSize(size)}, at or above the recommended ${formatByteSize(MAX_JSON_INPUT_SIZE)} limit. Formatting may be slow or freeze the tab. Large JSON is not guaranteed to be safe in the browser.`;
  }

  if (size >= WARN_JSON_INPUT_SIZE) {
    return `This input is ${formatByteSize(size)}. Large JSON can slow the browser. The recommended maximum is ${formatByteSize(MAX_JSON_INPUT_SIZE)}.`;
  }

  return null;
}
