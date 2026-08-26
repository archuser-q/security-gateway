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
import { Badge, Card, Grid, Group, Stack, Text } from '@mantine/core';

export type PluginConfigGridItem = {
  name: string;
  config: Record<string, unknown>;
  // Nội dung phụ hiện cạnh badge tên plugin - vd nguồn plugin đến từ
  // đâu (Route/Plugin Config/Service) bên tab Plugins của Route Detail.
  // Plugin Config Detail không cần meta vì plugin ở đó luôn thuộc thẳng
  // về nó, không có khái niệm "nguồn".
  meta?: React.ReactNode;
};

const formatConfigValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// Trước đây mỗi Card cao thấp khác nhau tuỳ số dòng config (Grid.Col
// không tự kéo Card giãn theo hàng), nhìn "khớp khểnh" giữa 2 cột -
// h="100%" ép Card giãn hết chiều cao ô Grid.Col của nó, các Card cùng
// hàng luôn bằng nhau. Tách thành component dùng chung cho tab Plugins
// của cả Route Detail và Plugin Config Detail thay vì lặp lại 2 nơi.
export const PluginConfigGrid = ({ items }: { items: PluginConfigGridItem[] }) => {
  if (items.length === 0) return null;

  return (
    <Grid>
      {items.map(({ name, config, meta }) => (
        <Grid.Col key={name} span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
              <Badge variant="light" color="teal" size="sm">
                {name}
              </Badge>
              {meta}
            </Group>
            <Stack gap={0}>
              {Object.keys(config).length === 0 ? (
                <Text size="sm" c="dimmed">
                  -
                </Text>
              ) : (
                Object.entries(config).map(([key, val]) => (
                  <Group key={key} justify="space-between" py={4} wrap="nowrap" gap="md">
                    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                      {key}
                    </Text>
                    <Text size="sm" ta="right" style={{ wordBreak: 'break-all' }}>
                      {formatConfigValue(val)}
                    </Text>
                  </Group>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
};
