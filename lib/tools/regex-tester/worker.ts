import { testRegex, type RegexRequest } from "./match";

type WorkerRequest = RegexRequest & { id: number };

addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { id, ...request } = event.data;
  postMessage({ id, result: testRegex(request) });
});
