import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export const ToLogHistoryBtn = () => {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleOpen = () => {
    open();
    fetch('/logs/access.log')
      .then(r => r.text())
      .then(text => {
        const lines = text
          .split('\n')
          .filter(line => line.includes('/apisix/admin/admins'))
          .map(line => {
            const match = line.match(/\[(.+?)\]/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
        setLogs(lines);
      });
  };

  const content = logs.map((line, index) => (
    <p key={index} style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
      {line}
    </p>
  ));

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={t('form.btn.loginHistory')}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {content}
      </Modal>

      <Button size="compact-xs" variant="default" onClick={handleOpen}>
        {t('form.btn.loginHistory')}
      </Button>
    </>
  );
};