import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/config/global';
import { req } from '@/config/req';

export type UpdateAdminStatusBtnProps = {
  id: string;
  status: boolean;
  name: string;
};

export const UpdateAdminStatusBtn = ({
  id,
  status,
  name,
}: UpdateAdminStatusBtnProps) => {
  const { t } = useTranslation();

  const openConfirm = () => {
    modals.openConfirmModal({
      centered: true,
      confirmProps: { color: status ? 'red' : 'green' },
      title: status
        ? t('form.adminStatus.disable')
        : t('form.adminStatus.enable'),
      children: (
        <Text>
          {status
            ? t('info.update.disable.content', { name })
            : t('info.update.enable.content', { name })}
          {name && (
            <Text
              component="span"
              fw={700}
              mx="0.25em"
              style={{ wordBreak: 'break-all' }}
            >
              {name}
            </Text>
          )}
          {t('mark.question')}
        </Text>
      ),
      labels: {
        confirm: status
          ? t('form.btn.disable')
          : t('form.btn.enable'),
        cancel: t('form.btn.cancel'),
      },
      onConfirm: async () => {
        await req.patch(`/admins/${id}/status`, {
          status: !status,
        });

        await queryClient.invalidateQueries({ 
          queryKey: ['admins'], 
          exact: false 
        });

        notifications.show({
          color: 'green',
          message: t('info.update.success'),
        });
      },
    });
  };

  return (
    <Button
      size="compact-xs"
      variant="light"
      color={status ? 'red' : 'green'}
      onClick={openConfirm}
    >
      {status ? t('form.btn.disable') : t('form.btn.enable')}
    </Button>
  );
};
