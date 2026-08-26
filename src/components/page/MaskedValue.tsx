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
import { ActionIcon, Group, Text } from '@mantine/core';
import { useState } from 'react';

import IconVisibility from '~icons/material-symbols/visibility';
import IconVisibilityOff from '~icons/material-symbols/visibility-off';

type MaskedValueProps = {
  value?: string;
};

// Không liên quan gì đến Traefik - đây là quyết định thiết kế riêng cho
// Secrets: field nhạy cảm (token, secret key, private key...) mặc định
// che, có nút hiện/ẩn. Lẽ thường của dữ liệu nhạy cảm, không phải sao
// chép từ đâu cả. Form chỉnh sửa (FormPartSecret) đã dùng
// FormItemPasswordInput cho các field này; component này là bản tương
// đương cho phần tóm tắt CHỈ ĐỌC (không gắn với react-hook-form).
export const MaskedValue = ({ value }: MaskedValueProps) => {
  const [visible, setVisible] = useState(false);

  if (!value) return <Text size="sm">-</Text>;

  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
        {visible ? value : '•'.repeat(Math.min(value.length, 24))}
      </Text>
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={() => setVisible((v) => !v)}
        aria-label="toggle-visibility"
      >
        {visible ? <IconVisibilityOff /> : <IconVisibility />}
      </ActionIcon>
    </Group>
  );
};
