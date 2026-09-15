import { createApp, type AppConfig } from "./app";
import { createD1Repositories } from "./db/d1";

export type WorkerEnv = {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T = Record<string, unknown>>(): Promise<T | null>;
        run(): Promise<unknown>;
        all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      };
    };
  };
  APP_ORIGIN?: string;
  PUBLIC_BASE_URL?: string;
  COOKIE_SECURE?: string;
  COOKIE_SAMESITE?: string;
};

function configFromEnv(env: WorkerEnv): AppConfig {
  const origins = (env.APP_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const sameSite = env.COOKIE_SAMESITE?.toLowerCase() === "none" ? "None" : "Lax";

  return {
    allowedOrigins: origins,
    cookieSecure: env.COOKIE_SECURE === "true" || sameSite === "None",
    cookieSameSite: sameSite,
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:8787").replace(/\/$/, ""),
  };
}

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const app = createApp({
      repos: createD1Repositories(env.DB),
      config: configFromEnv(env),
    });
    return app.fetch(request);
  },
};

export default worker;
