export interface ParsedLog {
    level?: string,
    message?: string,
    [key: string]: unknown
}

export function parseLog(raw: string): ParsedLog {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}