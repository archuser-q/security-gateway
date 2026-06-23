export interface ClickHouseLog {
  username: string
  success: number   // HTTP status code: 200, 401, 403, 404...
  reason: string
  ip: string
  user_agent: string
  ts: string         // 'YYYY-MM-DD HH:MM:SS'
}

export interface ResourceAccessLog {
  username: string
  resource: string
  resource_id: string
  method: string
  status: number
  ip: string
  user_agent: string
  ts: string
}

export interface TimelineEntry {
  date: string
  total: number
  failed: number
}