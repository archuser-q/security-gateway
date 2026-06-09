import type { ClickHouseLog, TimelineEntry } from "@/types/chart/log"
import { CLICKHOUSE_PASS, CLICKHOUSE_TABLE_REQUEST, CLICKHOUSE_TABLE_LOGIN, CLICKHOUSE_URL, CLICKHOUSE_USER } from '@/stores/global'

export const fetchLogs = async (page: number, pageSize: number, search: string) => {
  const offset = (page - 1) * pageSize
  const whereClause = search
    ? `WHERE uri ILIKE '%${search}%' OR user ILIKE '%${search}%'`
    : ''

  const query = `SELECT * FROM quickstart_db.${CLICKHOUSE_TABLE_REQUEST} ${whereClause} ORDER BY parseDateTimeBestEffort("@timestamp") DESC LIMIT ${pageSize} OFFSET ${offset} FORMAT JSON`
  const countQuery = `SELECT count() as total FROM quickstart_db.${CLICKHOUSE_TABLE_REQUEST} ${whereClause} FORMAT JSON`

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

export const fetchLogsForTimeline = async (): Promise<TimelineEntry[]> => {
  const query = `
    SELECT 
        toDate(parseDateTimeBestEffort("@timestamp")) as date,
        count() as total,
        countIf(log_status = 'failed') as failed
    FROM quickstart_db.${CLICKHOUSE_TABLE_REQUEST}
    WHERE toDate(parseDateTimeBestEffort("@timestamp")) >= toDate(now() - INTERVAL 7 DAY)
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
    ? `WHERE uri ILIKE '%${search}%' OR user ILIKE '%${search}%'`
    : ''

  const query = `SELECT * FROM quickstart_db.${CLICKHOUSE_TABLE_LOGIN} ${whereClause} ORDER BY "@timestamp" DESC LIMIT ${pageSize} OFFSET ${offset} FORMAT JSON`
  const countQuery = `SELECT count() as total FROM quickstart_db.${CLICKHOUSE_TABLE_LOGIN} ${whereClause} FORMAT JSON`

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
        toDate(parseDateTimeBestEffort("@timestamp")) as date,
        count() as total,
        countIf(log_status = 'failed') as failed
    FROM quickstart_db.${CLICKHOUSE_TABLE_LOGIN}
    WHERE toDate(parseDateTimeBestEffort("@timestamp")) >= toDate(now() - INTERVAL 7 DAY)
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