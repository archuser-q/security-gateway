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
import { CloseButton, TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconSearch from '~icons/material-symbols/search';

type ListSearchBoxProps = {
  /** current value from the parent (URL param or local state) */
  value?: string;
  /** called ~300ms after the user stops typing, and immediately on clear */
  onSearch: (value: string) => void;
  placeholder?: string;
  w?: number | string;
};

// Ô tìm kiếm bo tròn dùng chung cho mọi trang danh sách - cùng vị trí
// (góc phải phía trên bảng) và cùng hình dạng với ô Search của Traefik.
// Không tự quyết việc search là server-side hay client-side, vì 2
// resource có thể khác nhau (xem comment trong routes/index.tsx và
// ssls/index.tsx).
export const ListSearchBox = (props: ListSearchBoxProps) => {
  const { value, onSearch, placeholder, w = 260 } = props;
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value ?? '');

  // Đồng bộ lại khi value từ ngoài đổi (ví dụ back/forward URL, hoặc
  // trang cha reset bộ lọc) - tránh ô search bị "lệch" so với dữ liệu
  // đang hiển thị.
  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const debouncedSearch = useDebouncedCallback((v: string) => onSearch(v), 300);

  return (
    <TextInput
      value={draft}
      onChange={(e) => {
        const v = e.currentTarget.value;
        setDraft(v);
        debouncedSearch(v);
      }}
      placeholder={placeholder ?? t('table.searchPlaceholder')}
      leftSection={<IconSearch />}
      radius="xl"
      size="sm"
      w={w}
      rightSection={
        draft ? (
          <CloseButton
            size="sm"
            onClick={() => {
              setDraft('');
              onSearch('');
            }}
          />
        ) : null
      }
    />
  );
};
