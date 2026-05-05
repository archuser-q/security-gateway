import { getConsumerListQueryOptions, getRouteListQueryOptions, getServiceListQueryOptions, getUpstreamListQueryOptions } from "@/apis/hooks"
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
    { data: consumerData }
  ] = useQueries({
    queries: [
      getRouteListQueryOptions({ page: 1, page_size: 100 }),
      getServiceListQueryOptions({ page: 1, page_size: 100 }),
      getUpstreamListQueryOptions({ page: 1, page_size: 100 }),
      getConsumerListQueryOptions({ page: 1, page_size: 100 }),
    ],
  })
  const CONSUMER_AUTH_PLUGINS = ['jwt-auth', 'key-auth', 'basic-auth', 'hmac-auth', 'ldap-auth', 'wolf-rbac']

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
    
    const consumerMap = consumerData?.list ?? []

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

    for (const route of routeData?.list ?? []) {
      const {
        id: routeId,
        name: routeName,
        upstream_id: routeUpstreamId,
        service_id: serviceId,
        plugins: routePlugins
      } = route.value

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

        if (serviceInfo?.upstreamId) {
          const upstreamNodeId = `upstream-${serviceInfo.upstreamId}`
          addNode({
            id: upstreamNodeId,
            value: {
              title: upstreamMap[serviceInfo.upstreamId] ?? serviceInfo.upstreamId,
              items: [{ text: 'Upstream' }],
            },
          })
          addEdge({ source: serviceNodeId, target: upstreamNodeId })
        }

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

      const routeAuthPlugins = Object.keys(routePlugins ?? {})
        .filter(p => CONSUMER_AUTH_PLUGINS.includes(p))

      if (routeAuthPlugins.length > 0){
        for (const consumer of consumerMap){
          const consumerPlugins = Object.keys(consumer.value.plugins ?? {})
          const hasMatch = routeAuthPlugins.some(p => consumerPlugins.includes(p))

          if (hasMatch){
            const consumerNodeId = `consumer-${consumer.value.username}`
            addNode({
              id: consumerNodeId,
              value: {
                title: consumer.value.username,
                items: [{ text: 'Consumer' }],
              }
            })
            addEdge({ 
              source: consumerNodeId, 
              target: 'routes' 
            })
          }
        }
      }
    }

    return { nodes, edges }
  }, [routeData, serviceMap, upstreamMap])
}

export default useData