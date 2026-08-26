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
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import PageHeader from '@/components/page/PageHeader';
import { SecretUsedByPanel } from '@/components/page/SecretUsedByPanel';
import type { APISIXType } from '@/types/schema/apisix';

// SecretUsedByPanel giữ nguyên như cũ (đã tự xử lý loading/rỗng) - chỉ
// chuyển từ nằm giữa trang General sang tab riêng để danh sách kết quả
// quét (có thể dài nếu Secret bị dùng ở nhiều Route/Service/Consumer/...)
// không còn ảnh hưởng bố cục trang General nữa.
function RouteComponent() {
  const { t } = useTranslation();
  const { manager, id } = useParams({
    from: '/_authenticated/secrets/detail/$manager/$id',
  });

  return (
    <>
      <PageHeader title={t('secretDetail.usedByTitle')} />
      <SecretUsedByPanel
        manager={manager as APISIXType['Secret']['manager']}
        id={id}
      />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/secrets/detail/$manager/$id/used-by/')({
  component: RouteComponent,
});
