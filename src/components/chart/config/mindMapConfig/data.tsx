import { getRouteListQueryOptions, getServiceListQueryOptions, getUpstreamListQueryOptions } from "@/apis/hooks"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import type { Edge, Node } from "@/types/chart/graphNode"

const findParents = (host: string, allHosts: Set<string>): string | null => {
  const parts = host.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.')
    if (allHosts.has(candidate)) return candidate
  }
  return null
}

const useData = () => {
  const [
    { data: routeData },
    { data: serviceData },
    { data: upstreamData },
  ] = useQueries({
    queries: [
      getRouteListQueryOptions({ page: 1, page_size: 100 }),
      getServiceListQueryOptions({ page: 1, page_size: 100 }),
      getUpstreamListQueryOptions({ page: 1, page_size: 100 }),
    ],
  })

  const serviceMap = useMemo(() => {
    if (!serviceData?.list) return {}
    return serviceData.list.reduce<
      Record<string, { name: string; upstreamId?: string }>
    >((acc, service) => {
      acc[service.value.id] = {
        name: service.value.name ?? service.value.id,
        upstreamId: service.value.upstream_id,
      }
      return acc
    }, {})
  }, [serviceData])

  const upstreamMap = useMemo(() => {
    if (!upstreamData?.list) return {}
    return upstreamData.list.reduce<Record<string, string>>((acc, upstream) => {
      acc[upstream.value.id] = upstream.value.name ?? upstream.value.id
      return acc
    }, {})
  }, [upstreamData])

  return useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const addedNodes = new Set<string>()
    const addedEdges = new Set<string>()

    const addNode = (node: Node) => {
      if (addedNodes.has(node.id)) return
      nodes.push(node)
      addedNodes.add(node.id)
    }

    const addEdge = (edge: Edge) => {
      const key = `${edge.source}-${edge.target}`
      if (addedEdges.has(key)) return
      edges.push(edge)
      addedEdges.add(key)
    }

    addNode({
      id: 'routes',
      value: { title: 'Routes', items: [] },
    })

    addNode({
      id: 'host-localhost',
      value: { title: 'localhost', items: [{ text: 'Host' }] },
    })
    addEdge({ source: 'host-localhost', target: 'routes' })

    const allHosts = new Set<string>()
    for (const route of routeData?.list ?? []) {
      const { host, hosts } = route.value
      for (const h of [...(hosts ?? []), ...(host ? [host] : [])]) {
        allHosts.add(h)
      }
    }

    for (const h of allHosts) {
      const ancestor = findParents(h, allHosts)
      addNode({
        id: `host-${h}`,
        value: {
          title: ancestor ? h.split('.')[0] : h, 
          items: [{ text: 'Host' }],
        },
      })
      addEdge({
        source: `host-${h}`,
        target: ancestor ? `host-${ancestor}` : 'routes',
      })
    }

    return { nodes, edges }
  }, [routeData, serviceMap, upstreamMap])
}

export default useData