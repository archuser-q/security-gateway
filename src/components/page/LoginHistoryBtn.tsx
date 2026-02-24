import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, ScrollArea } from '@mantine/core';
import HistoryRecordForm from '../form/HistoryRecordForm';
import { useTranslation } from 'react-i18next';

export const LoginHistoryBtn = ({username}:{username:string}) => {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={t('form.btn.loginHistory')}
        scrollAreaComponent={ScrollArea.Autosize}
        size="xl"
      >
        <HistoryRecordForm username={username}/>
      </Modal>

      <Button variant="default" size='compact-xs' onClick={open}>
        {t('form.btn.loginHistory')}
      </Button>
    </>
  );
}