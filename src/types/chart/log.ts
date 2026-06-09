export type ClickHouseLog = {
  '@timestamp': string
  status: string
  user: string
  request_id: string
  uri: string
  service_id: string
  route_id: string
  latency: string
  method: string
  log_status: string
  client_ip: string
}

export type TimelineEntry = {
  date: string
  total: number
  failed: number
}