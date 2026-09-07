export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJsonResponse<Value>(response: Response, path: string): Promise<Value> {
  if (!response.ok) {
    throw new ApiError(`request to ${path} failed with status ${response.status}`, response.status);
  }
  return response.json() as Promise<Value>;
}

export async function fetchJson<Value>(path: string): Promise<Value> {
  const response = await fetch(path);
  return parseJsonResponse<Value>(response, path);
}

export type HttpMethod = "POST" | "PATCH" | "DELETE" | "PUT";

export async function sendJson<Value>(method: HttpMethod, path: string, body?: unknown): Promise<Value> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseJsonResponse<Value>(response, path);
}
