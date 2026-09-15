export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type JsonError = {
  error: {
    code: string;
    message: string;
  };
};

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...Object.fromEntries(new Headers(headers)),
    },
  });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  const body: JsonError = { error: { code, message } };
  return json(body, status, headers);
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = part.slice(0, index).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }

  return null;
}

export const SESSION_COOKIE = "infyratools_session";

export function sessionCookie(token: string, options: {
  maxAge: number;
  secure: boolean;
  sameSite: "Lax" | "None";
}): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${options.sameSite}`,
    `Max-Age=${Math.floor(options.maxAge / 1000)}`,
  ];
  if (options.secure || options.sameSite === "None") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearSessionCookie(options: {
  secure: boolean;
  sameSite: "Lax" | "None";
}): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${options.sameSite}`,
    "Max-Age=0",
  ];
  if (options.secure || options.sameSite === "None") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("UNSUPPORTED_TYPE");
  }

  try {
    return await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}
