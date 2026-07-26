export interface SafeParseResult {
  ok: boolean
  data?: any
  error?: string
  httpStatus?: number
  contentType?: string
  rawText?: string
  hint?: string
}

export async function safeParseResponse(response: Response): Promise<SafeParseResult> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json()
      if (!response.ok || data?.status === "failed") {
        return {
          ok: false,
          error: data?.error || `Request failed with status ${response.status}`,
          hint: data?.hint,
          httpStatus: response.status,
          data,
        }
      }
      return { ok: true, data, httpStatus: response.status }
    } catch (parseErr: any) {
      return {
        ok: false,
        error: `Invalid JSON response from server: ${parseErr.message}`,
        httpStatus: response.status,
        contentType,
      }
    }
  }

  const text = await response.text()
  return {
    ok: false,
    error: text || `Request failed with status ${response.status}`,
    httpStatus: response.status,
    contentType,
    rawText: text,
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || ""
}
