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
import { Link, type LinkProps } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { FileRoutesByTo } from '@/routeTree.gen';
import IconPlus from '~icons/material-symbols/add';
import IconArrowRight from '~icons/material-symbols/arrow-right-alt';

export type ToAddPageBtnProps = {
  to: keyof FilterKeys<FileRoutesByTo, 'add'>;
  label: string;
} & Pick<LinkProps, 'params'>;

export const ToAddPageBtn = ({ to, params, label }: ToAddPageBtnProps) => {
  return (
    <Link
      to={to}
      params={params}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500
                 px-3.5 py-2 text-sm font-medium text-white shadow-sm
                 transition-all hover:from-teal-700 hover:to-teal-600 hover:shadow-md
                 active:scale-[0.98]"
    >
      <IconPlus className="h-4 w-4" />
      {label}
    </Link>
  );
};

export type ToDetailPageBtnProps = {
  to:
    | keyof FilterKeys<FileRoutesByTo, '$id'>
    | keyof FilterKeys<FileRoutesByTo, '$routeId'>
    | keyof FilterKeys<FileRoutesByTo, '$username'>;
} & Pick<LinkProps, 'params'>;

export const ToDetailPageBtn = (props: ToDetailPageBtnProps) => {
  const { params, to } = props;
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      params={params}
      className="group inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium
                 text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
    >
      {t('form.btn.view')}
      <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
};