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

    const consumerList = consumerData?.list ?? []
    const routeList = routeData?.list ?? []

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

    const allHosts = new Set<string>()
    for (const route of routeList) {
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
          items: [{ text: ancestor ? 'Sub-Host' : 'Host' }],
        },
      })
      if (ancestor) {
        addEdge({ source: `host-${h}`, target: `host-${ancestor}` })
      }
    }

    const routeAuthConsumers = new Map<string, string[]>()
    for (const route of routeList) {
      const { id: routeId, plugins: routePlugins } = route.value
      const routeAuthPlugins = Object.keys(routePlugins ?? {}).filter(p =>
        CONSUMER_AUTH_PLUGINS.includes(p)
      )
      if (routeAuthPlugins.length > 0) {
        const matchedConsumers = consumerList
          .filter(consumer => {
            const consumerPlugins = Object.keys(consumer.value.plugins ?? {})
            return routeAuthPlugins.some(p => consumerPlugins.includes(p))
          })
          .map(consumer => consumer.value.username)
        routeAuthConsumers.set(routeId, matchedConsumers)
      }
    }
    
    // Fixing edge cases: Route with no hosts attached to it
    const noHostAuthConsumer = new Set<string>()
    for (const route of routeList){
      const {
        id: routeId,
        host,hosts
      } = route.value
      const hasNoHost = !host && (!hosts || hosts.length===0)
      if (hasNoHost){
        const matchedConsumers = routeAuthConsumers.get(routeId) ?? []
        for (const username of matchedConsumers){
          noHostAuthConsumer.add(username)
        }
      }
    }

    const localhostConsumers = new Set(noHostAuthConsumer)
    if (localhostConsumers.size>0){
      for (const username of localhostConsumers){
        const consumerNodeId = `consumer-${username}`
        addNode({
          id: `consumer-${username}`,
          value: {
            title: username,
            items: [{
              text: 'Consumer'
            }]
          }
        })
        addEdge({
          source: 'host-localhost',
          target: consumerNodeId
        })
        addEdge({
          source: consumerNodeId,
          target: 'routes'
        })
      }
    }
    else{
      addEdge({
        source: 'host-localhost',
        target: 'routes'
      })
    }

    for (const route of routeList) {
      const { id: routeId, host, hosts } = route.value
      const routeHosts = [...(hosts ?? []), ...(host ? [host] : [])]
      const matchedConsumers = routeAuthConsumers.get(routeId) ?? []

      for (const h of routeHosts) {
        const hostNodeId = `host-${h}`
        const ancestor = findParents(h, allHosts)

        if (matchedConsumers.length > 0) {
          for (const username of matchedConsumers) {
            const consumerNodeId = `consumer-${username}`
            addNode({
              id: consumerNodeId,
              value: {
                title: username,
                items: [{ text: 'Consumer' }],
              },
            })
            if (!ancestor) {
              addEdge({ source: hostNodeId, target: consumerNodeId })
            }
            addEdge({ source: consumerNodeId, target: 'routes' })
          }
        } else {
          if (!ancestor) {
            addEdge({ source: hostNodeId, target: 'routes' })
          }
        }
      }
    }

    for (const route of routeList) {
      const {
        id: routeId,
        name: routeName,
        upstream_id: routeUpstreamId,
        service_id: serviceId,
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
    }

    return { nodes, edges }
  }, [routeData, serviceMap, upstreamMap, consumerData])
}

export default useData