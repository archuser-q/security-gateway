import type { ClickHouseLog, TimelineEntry, ResourceAccessLog } from "@/types/chart/log"
import { CLICKHOUSE_PASS, CLICKHOUSE_TABLE_REQUEST, CLICKHOUSE_TABLE_LOGIN, CLICKHOUSE_URL, CLICKHOUSE_USER, CLICKHOUSE_DATABASE } from '@/stores/global'

export const fetchAccessLogs = async (page: number, pageSize: number, search: string) => {
  const offset = (page - 1) * pageSize
  const whereClause = search
    ? `WHERE username ILIKE '%${search.replace(/'/g, "''")}%' OR reason ILIKE '%${search.replace(/'/g, "''")}%'`
    : ''

  const query = `SELECT * FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_REQUEST} ${whereClause} ORDER BY ts DESC LIMIT ${pageSize} OFFSET ${offset} FORMAT JSON`
  const countQuery = `SELECT count() as total FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_REQUEST} ${whereClause} FORMAT JSON`

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
    list: json.data as ResourceAccessLog[],
    total: Number(countJson.data?.[0]?.total ?? 0),
  }
}

export const fetchAccessLogsForTimeline = async (): Promise<TimelineEntry[]> => {
  const query = `
    SELECT
        toDate(ts) as date,
        count() as total,
        countIf(status >= 400) as failed
    FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_REQUEST}
    WHERE toDate(ts) >= toDate(now() - INTERVAL 7 DAY)
    GROUP BY date
    ORDER BY date ASC
    FORMAT JSON
  `
  const res = await fetch(
    `${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: 'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`) },
    }
  )
  const json = await res.json()
  return json.data as TimelineEntry[]
}

export const fetchLoginLogs = async (page: number, pageSize: number, search: string) => {
  const offset = (page - 1) * pageSize
  const whereClause = search
    ? `WHERE username ILIKE '%${search.replace(/'/g, "''")}%' OR reason ILIKE '%${search.replace(/'/g, "''")}%'`
    : ''

  const query = `SELECT * FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_LOGIN} ${whereClause} ORDER BY ts DESC LIMIT ${pageSize} OFFSET ${offset} FORMAT JSON`
  const countQuery = `SELECT count() as total FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_LOGIN} ${whereClause} FORMAT JSON`

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

export const fetchLoginLogsForTimeline = async (): Promise<TimelineEntry[]> => {
  const query = `
    SELECT
        toDate(ts) as date,
        count() as total,
        countIf(success != 200) as failed
    FROM ${CLICKHOUSE_DATABASE}.${CLICKHOUSE_TABLE_LOGIN}
    WHERE toDate(ts) >= toDate(now() - INTERVAL 7 DAY)
    GROUP BY date
    ORDER BY date ASC
    FORMAT JSON
  `
  const res = await fetch(
    `${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: 'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`) },
    }
  )
  const json = await res.json()
  return json.data as TimelineEntry[]
}