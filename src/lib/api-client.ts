export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit) {
  let response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshResponse = await fetch("/api/v1/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    return response;
  }

  response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  return response;
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetchWithRefresh(input, init);
  const payload = await parseJsonSafely(response);

  if (!response.ok || payload?.success === false) {
    throw new ApiClientError(
      payload?.error ?? "La operación no pudo completarse",
      response.status,
    );
  }

  return payload.data as T;
}

export async function apiAction<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  return apiJson<T>(input, init);
}

export async function downloadFile(input: RequestInfo | URL) {
  const response = await fetchWithRefresh(input);

  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw new ApiClientError(
      payload?.error ?? "No fue posible descargar el archivo",
      response.status,
    );
  }

  const contentDisposition = response.headers.get("content-disposition");
  const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
  const fileName = fileNameMatch?.[1] ?? "reporte.pdf";
  const blob = await response.blob();

  return { blob, fileName };
}

export async function logoutRequest() {
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
