import { getRouteListQueryOptions, getServiceListQueryOptions, getUpstreamListQueryOptions } from "@/apis/hooks"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

interface NodeValue {
  title: string
  items: { text: string; value?: string }[]
}

interface Node {
  id: string
  value: NodeValue
}

interface Edge {
  source: string
  target: string
  value?: string
}

const getParentDomain = (host: string): string | null => {
  const parts = host.split('.')
  if (parts.length <= 2) return null
  return parts.slice(1).join('.')
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

    const allHosts = new Set<string>()
    for (const route of routeData?.list ?? []) {
      const { host, hosts } = route.value
      const hostList: string[] = [...(hosts ?? []), ...(host ? [host] : [])]
      for (const h of hostList) allHosts.add(h)
    }

    for (const route of routeData?.list ?? []) {
      const {
        id: routeId,
        name: routeName,
        host,
        hosts,
        upstream_id: routeUpstreamId,
        service_id: serviceId,
      } = route.value

      const hostList: string[] = [...(hosts ?? []), ...(host ? [host] : [])]

      for (const h of hostList) {
        const hostNodeId = `host-${h}`
        addNode({
          id: hostNodeId,
          value: { title: h, items: [{ text: 'Host' }] },
        })

        const parentDomain = getParentDomain(h)

        if (parentDomain && allHosts.has(parentDomain)) {
          const parentNodeId = `host-${parentDomain}`
          addNode({
            id: parentNodeId,
            value: { title: parentDomain, items: [{ text: 'Host' }] },
          })
          addEdge({ source: hostNodeId, target: parentNodeId })
          addEdge({ source: parentNodeId, target: 'routes', value: routeName || routeId })
        } else {
          addEdge({ source: hostNodeId, target: 'routes', value: routeName || routeId })
        }
      }

      if (serviceId) {
        const serviceInfo = serviceMap[serviceId]
        const serviceNodeId = `service-${serviceId}`
        addNode({
          id: serviceNodeId,
          value: {
            title: serviceInfo?.name ?? serviceId,
            items: [{ text: 'Service' }],
          },
        })
        addEdge({ source: 'routes', target: serviceNodeId, value: routeName || routeId })
      } else if (routeUpstreamId) {
        const upstreamNodeId = `upstream-${routeUpstreamId}`
        addNode({
          id: upstreamNodeId,
          value: {
            title: upstreamMap[routeUpstreamId] ?? routeUpstreamId,
            items: [{ text: 'Upstream' }],
          },
        })
        addEdge({ source: 'routes', target: upstreamNodeId, value: routeName || routeId })
      }
    }

    return { nodes, edges }
  }, [routeData, serviceMap, upstreamMap])
}

export default useData