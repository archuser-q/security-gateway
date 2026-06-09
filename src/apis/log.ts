import type { ClickHouseLog } from "@/types/chart/log"
import { CLICKHOUSE_PASS, CLICKHOUSE_TABLE, CLICKHOUSE_URL, CLICKHOUSE_USER } from '@/stores/global'

export const fetchAllLogsForTimeline = async () => {
  const query = `
    SELECT "@timestamp", log_status 
    FROM quickstart_db.${CLICKHOUSE_TABLE}
    ORDER BY "@timestamp" ASC
    FORMAT JSON
  `
  const res = await fetch(
    `${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: 'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`) },
    }
  )
  const json = await res.json()
  return json.data as ClickHouseLog[]
}

export const fetchLogs = async (page: number, pageSize: number, search: string) => {
  const offset = (page - 1) * pageSize
  const whereClause = search
    ? `WHERE uri ILIKE '%${search}%' OR user ILIKE '%${search}%'`
    : ''

  const query = `SELECT * FROM quickstart_db.${CLICKHOUSE_TABLE} ${whereClause} ORDER BY "@timestamp" DESC LIMIT ${pageSize} OFFSET ${offset} FORMAT JSON`
  const countQuery = `SELECT count() as total FROM quickstart_db.${CLICKHOUSE_TABLE} ${whereClause} FORMAT JSON`

  const [res, countRes] = await Promise.all([
    fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: 'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`) },
    }),
    fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(countQuery)}`, {
      headers: { Authorization: 'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`) },
    }),
  ])

  const [json, countJson] = await Promise.all([res.json(), countRes.json()])

  return {
    list: json.data as ClickHouseLog[],
    total: Number(countJson.data?.[0]?.total ?? 0),
  }
}