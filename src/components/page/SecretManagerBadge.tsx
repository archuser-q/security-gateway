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
import { Badge } from '@mantine/core';

// Màu riêng cho từng provider - quét mắt nhanh khi danh sách có nhiều
// loại Secret khác nhau. Dùng chung cho cả list và detail.
const MANAGER_COLOR: Record<string, string> = {
  vault: 'yellow',
  aws: 'orange',
  gcp: 'blue',
};

export const SecretManagerBadge = ({ manager }: { manager: string }) => (
  <Badge variant="light" color={MANAGER_COLOR[manager] ?? 'gray'} size="sm">
    {manager.toUpperCase()}
  </Badge>
);
