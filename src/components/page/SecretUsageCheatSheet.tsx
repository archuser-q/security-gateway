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
import { Button, Card, CopyButton, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type SecretUsageCheatSheetProps = {
  manager: string;
  id: string;
};

// Cú pháp "$secret://{manager}/{id}/{secret_name}/{key}" đã xác nhận từ
// tài liệu chính thức apisix.apache.org/docs/apisix/terminology/secret -
// không phải suy đoán. Điền sẵn đúng manager/id thật của Secret đang
// xem, chỉ còn phần secret_name/key (tuỳ cách tổ chức dữ liệu riêng của
// từng Vault/AWS/GCP) là người dùng cần tự thay.
export const SecretUsageCheatSheet = ({ manager, id }: SecretUsageCheatSheetProps) => {
  const { t } = useTranslation();
  const example = `$secret://${manager}/${id}/my-secret-name/my-key`;

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text fw={600} size="sm" mb={4}>
        {t('secretDetail.usageTitle')}
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        {t('secretDetail.usageHint', { placeholder: 'my-secret-name/my-key', manager })}
      </Text>
      <Group
        justify="space-between"
        wrap="nowrap"
        p="xs"
        style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 8 }}
      >
        <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
          {example}
        </Text>
        <CopyButton value={example}>
          {({ copied, copy }) => (
            <Button size="compact-xs" variant="subtle" onClick={copy}>
              {copied ? t('secretDetail.copied') : t('secretDetail.copy')}
            </Button>
          )}
        </CopyButton>
      </Group>
    </Card>
  );
};
