import { getRouteListQueryOptions } from "@/apis/hooks";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const mindmapData = () => {
  const { data: routeData } = useQuery(
    getRouteListQueryOptions({ page: 1, page_size: 10 })
  );
  return useMemo(() => {
    if (!routeData) return undefined;

    return {
      id: "System",
      children: routeData.list.map((route: any) => ({
        id: route.value.name,
        children: [
          { id: `service: ${route.value.service_id}` },
        ],
      })),
    };
  }, [routeData]);
};
