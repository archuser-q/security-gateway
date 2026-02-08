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
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/config/global';
import { req } from '@/config/req';

export type UpdateAdminStatusBtnProps = {
  id: string;
  status: boolean;
};

export const UpdateAdminStatusBtn = ({ id, status }: UpdateAdminStatusBtnProps) => {
  const { t } = useTranslation();

  const handleClick = async () => {
    await req.patch(`/admins/${id}/status`, {
      status: !status, 
    });

    notifications.show({
      color: 'green',
      message: t('info.update.success'),
    });

    queryClient.invalidateQueries();
  };

  return (
    <Button
      size="compact-xs"
      variant="light"
      color={status ? 'red' : 'green'}
      onClick={handleClick}
    >
      {status ? t('form.btn.disable') : t('form.btn.enable')}
    </Button>
  );
};
