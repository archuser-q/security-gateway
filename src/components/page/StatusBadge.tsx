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
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type StatusBadgeProps = {
  enabled: boolean;
};

// Cùng ý nghĩa với <Badge status="success"/error"> của antd trước đây
// (bật/tắt của Route, SSL,...), chỉ đổi cách hiển thị sang icon vòng
// tròn + chữ màu cho khớp bố cục ảnh mẫu, không đổi nguồn dữ liệu
// (vẫn nhận thẳng boolean record.value.status === 1 từ nơi gọi).
export const StatusBadge = (props: StatusBadgeProps) => {
  const { enabled } = props;
  const { t } = useTranslation();

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600">
        <IconCircleCheck size={16} stroke={2} />
        <span className="text-sm">{t('table.enabled')}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-400">
      <IconCircleDashed size={16} stroke={2} />
      <span className="text-sm">{t('table.disabled')}</span>
    </span>
  );
};
