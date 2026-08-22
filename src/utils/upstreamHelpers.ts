/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// APISIX upstream.nodes can be either an array of {host, port, weight}
// objects, or an object map of "host:port" -> weight. Both shapes are
// valid Admin API responses, so callers just want a count either way.
export const nodeCount = (nodes: unknown): number => {
  if (!nodes) return 0;
  if (Array.isArray(nodes)) return nodes.length;
  if (typeof nodes === 'object') return Object.keys(nodes).length;
  return 0;
};

export type NormalizedNode = { host: string; port?: number; weight: number };

/** Chuẩn hoá cả 2 dạng nodes về cùng 1 hình dạng {host, port, weight} để hiển thị thật (không chỉ đếm số lượng). */
export const normalizeNodes = (nodes: unknown): NormalizedNode[] => {
  if (!nodes) return [];
  if (Array.isArray(nodes)) {
    return nodes.map((n: { host: string; port?: number; weight: number }) => ({
      host: n.host,
      port: n.port,
      weight: n.weight,
    }));
  }
  if (typeof nodes === 'object') {
    return Object.entries(nodes as Record<string, number>).map(([key, weight]) => {
      const lastColon = key.lastIndexOf(':');
      if (lastColon === -1) return { host: key, weight };
      const host = key.slice(0, lastColon);
      const port = Number(key.slice(lastColon + 1));
      return { host, port: Number.isNaN(port) ? undefined : port, weight };
    });
  }
  return [];
};
