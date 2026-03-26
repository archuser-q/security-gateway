import { ActionIcon, Menu } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { ChangePasswordForm } from '@/components/form/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';
import { ProfileViewModal } from '../form/ProfileForm';
import { useSetAtom } from 'jotai';
import { isSettingsOpenAtom } from '@/stores/global';
import { useNavigate } from '@tanstack/react-router';

const ProfileMap = {
  personalInfo: 'Personal Info',
  changePassword: 'Change Password',
  setting: 'Setting',
  logOut: 'Log out'
};

export const ProfileMenu = () => {
  const auth = useAuth();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const navigate = useNavigate();

  const handleClick = (key: string) => {
    if (key === 'changePassword') {
      modals.open({
        title: 'Change Password',
        centered: true,
        children: (
          <ChangePasswordForm
            id={auth.user?.id || ''}
            password=""
          />
        ),
      });
    }
    if (key === 'personalInfo') {
      modals.open({
        title: 'Personal Info',
        centered: true,
        size: 'xl',
        children: (
          <ProfileViewModal id={auth.user?.id || ''} />
        ),
      });
    }
    if (key === 'setting') {
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
        {Object.entries(ProfileMap).map(([key, label]) => (
          <Menu.Item key={key} onClick={() => handleClick(key)}>
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};