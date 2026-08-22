import { z } from 'zod';

const ResourceStats = z.record(
  z.enum([
    'routes', 'services', 'upstreams', 'consumers',
    'consumer_groups', 'plugin_configs', 'global_rules', 'ssls',
    'admins', 'secrets', 'stream_routes', 'protos'
  ]),
  z.object({
    total: z.number(),
    enabled: z.number(),
    disabled: z.number(),
  })
);

export const APISIXStats = {
  ResourceStats,
};