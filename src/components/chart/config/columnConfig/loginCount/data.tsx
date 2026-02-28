import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export const useLoginChartData = () => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const results = useQuery(
    {
      queryKey: ['login-history-count', user?.username],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/login-history/count`, {
          params: { username: user?.username }
        });
        return response.data.data;
      },
      enabled: !!user?.username,
    }
  );
  console.log("History")
  console.log(results)

  const rawData = results.data || [];
  const isLoading = results.isLoading;

  const chartData = rawData.map((item: any) => ({
    type: item.timestamp,
    value: item.count,
  }));

  return { data: chartData, isLoading };
};