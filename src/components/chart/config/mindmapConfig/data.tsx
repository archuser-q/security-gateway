import { getRouteListQueryOptions, getServiceListQueryOptions } from "@/apis/hooks";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const mindmapData = () => {
  const { data: routeData } = useQuery(
    getRouteListQueryOptions({ 
      page: 1, page_size: 10 
    })
  );
  const { data: serviceData } = useQuery(
    getServiceListQueryOptions({
      page: 1, page_size:10
    })
  );
  
  return useMemo(() => {
    if (!routeData || !serviceData) return undefined;

    return {
      id: "System",
      type: "root",
      children: routeData.list.map((route: any) => {
        const matchedService = serviceData.list.find(
          (service: any) => service.value.id === route.value.service_id
        );

        return {
          id: route.value.name,
          type: "route",
          children: matchedService ? [
            {
              id: `${matchedService.value.name}`,
              type: "service",
              children: [
                {
                  id: `upstream: ${matchedService.value.upstream_id}`,
                  type: "upstream",
                }
              ],
            },
          ] : [],
        };
      }),
    };
  }, [routeData, serviceData]);
};