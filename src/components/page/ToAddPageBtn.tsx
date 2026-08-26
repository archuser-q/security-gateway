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
import type { ButtonProps } from '@mantine/core';
import type { LinkProps } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { RouteLinkBtn } from '@/components/Btn';
import type { FileRoutesByTo } from '@/routeTree.gen';
import IconPlus from '~icons/material-symbols/add';

export type ToAddPageBtnProps = {
  to: keyof FilterKeys<FileRoutesByTo, 'add'>;
  label: string;
} & Pick<LinkProps, 'params'> &
  Partial<Pick<ButtonProps, 'variant' | 'color' | 'radius'>>;

// variant/color/radius có default giữ nguyên như cũ (gradient) để các
// trang khác không đổi giao diện; chỉ trang nào truyền riêng (vd
// Routes/SSLs/... theo ảnh mẫu) mới đổi sang nút teal bo tròn hẳn.
export const ToAddPageBtn = ({
  to,
  params,
  label,
  variant = 'gradient',
  color,
  radius,
}: ToAddPageBtnProps) => {
  return (
    <RouteLinkBtn
      leftSection={<IconPlus />}
      size="compact-sm"
      variant={variant}
      color={color}
      radius={radius}
      to={to}
      params={params}
    >
      {label}
    </RouteLinkBtn>
  );
};

export type ToDetailPageBtnProps = {
  to:
    | keyof FilterKeys<FileRoutesByTo, '$id'>
    | keyof FilterKeys<FileRoutesByTo, '$routeId'>
    | keyof FilterKeys<FileRoutesByTo, '$username'>;
} & Pick<LinkProps, 'params'> &
  Partial<Pick<ButtonProps, 'variant' | 'rightSection'>>;

// Tương tự ToAddPageBtn: variant/rightSection có default giữ nguyên
// như cũ (nút "light" không mũi tên), chỉ đổi khi nơi gọi truyền vào.
export const ToDetailPageBtn = (props: ToDetailPageBtnProps) => {
  const { params, to, variant = 'light', rightSection } = props;
  const { t } = useTranslation();
  return (
    <RouteLinkBtn
      size="compact-xs"
      variant={variant}
      rightSection={rightSection}
      to={to}
      params={params}
    >
      {t('form.btn.view')}
    </RouteLinkBtn>
  );
};
