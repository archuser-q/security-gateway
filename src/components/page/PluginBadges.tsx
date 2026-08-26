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
import { Badge, Group } from '@mantine/core';

// Trước đây component này bị định nghĩa lặp lại y hệt ở cả
// consumer_groups/index.tsx lẫn plugin_configs/index.tsx (vì
// ConsumerGroup thực chất là PluginConfig thiếu field name - xem
// comment gốc trong consumer_groups/index.tsx). Gộp về đây để 2 trang
// dùng chung, hành vi render giữ nguyên như cũ.
export const PluginBadges = ({ plugins }: { plugins?: Record<string, unknown> }) => {
  const names = Object.keys(plugins ?? {});
  if (names.length === 0) return <>-</>;
  return (
    <Group gap={4} wrap="wrap">
      {names.map((name) => (
        <Badge key={name} variant="light" color="teal" size="sm">
          {name}
        </Badge>
      ))}
    </Group>
  );
};
