import {
  MAX_DISPLAYED_MATCHES,
  REGEX_MATCH_TIMEOUT_MS,
} from "./constants";
import type { RegexRequest, RegexResult } from "./match";

export type RegexWorkerFactory = () => Worker;

type WorkerResponse = {
  id: number;
  result: RegexResult;
};

let nextRequestId = 1;

export function runRegexTest(
  request: RegexRequest,
  options: {
    timeoutMs?: number;
    createWorker?: RegexWorkerFactory;
  } = {},
): Promise<RegexResult> {
  const timeoutMs = options.timeoutMs ?? REGEX_MATCH_TIMEOUT_MS;
  const payload = {
    ...request,
    maxMatches: request.maxMatches ?? MAX_DISPLAYED_MATCHES,
  };

  if (typeof options.createWorker !== "function" && typeof Worker === "undefined") {
    return Promise.resolve({
      ok: false,
      message:
        "This browser cannot run a Web Worker, so regex matching was not started.",
    });
  }

  return new Promise((resolve) => {
    const worker =
      options.createWorker?.() ??
      new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    const id = nextRequestId;
    nextRequestId += 1;
    let settled = false;

    const finish = (result: RegexResult) => {
      if (settled) {
        return;
      }

      settled = true;
      globalThis.clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = globalThis.setTimeout(() => {
      finish({
        ok: false,
        message: `Matching took longer than ${timeoutMs} ms and was stopped. The pattern may be too expensive (catastrophic backtracking).`,
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id === id) {
        finish(event.data.result);
      }
    };

    worker.onerror = () => {
      finish({
        ok: false,
        message: "The regex worker failed. Check the pattern and try again.",
      });
    };

    worker.postMessage({ id, ...payload });
  });
}
