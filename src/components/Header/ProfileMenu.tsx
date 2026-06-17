import { ActionIcon, Menu } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { ChangePasswordForm } from '@/components/form/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';
import { ProfileViewModal } from '../form/ProfileForm';
import { useSetAtom } from 'jotai';
import { isSettingsOpenAtom } from '@/stores/global';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const ProfileMenu = () => {
  const auth = useAuth();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const navigate = useNavigate();
  const {t} = useTranslation();

  const ProfileMap = {
    personalInfo: t('sources.personalInfo'),
    changePassword: t('sources.changePassword'),
    setting: t('sources.setting'),
    logOut: t('sources.logout')
  };

  const handleClick = (key: string) => {
    if (key === 'changePassword') {
        modals.open({
            title: 'Change Password',
            centered: true,
            children: <ChangePasswordForm username={auth.user?.username || ''} />,
        });
    }
    if (key === 'personalInfo') {
        modals.open({
            title: 'Personal Info',
            centered: true,
            size: 'xl',
            children: <ProfileViewModal username={auth.user?.username || ''} />,
        });
    }
    if (key === 'setting') {
      if (auth.user?.role !== 'super_admin') return;
      setIsSettingsOpen(true); 
    }
    if (key === 'logOut') {
      auth.logout();
      navigate({to:'/login'})
    }
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="light" size="sm">
          <IconUser />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {Object.entries(ProfileMap).map(([key, label]) => {
          if (key === 'setting' && auth.user?.role !== 'super_admin') {
            return null;
          }

          return (
            <Menu.Item key={key} onClick={() => handleClick(key)}>
              {label}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};