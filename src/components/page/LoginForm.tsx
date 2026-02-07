import { useAuth } from '@/context/AuthContext';
import { handleAdminLogin, type LoginParams } from '@/utils/auth';
import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormText,
} from '@ant-design/pro-components';
import { useNavigate } from '@tanstack/react-router';
import { ConfigProvider, theme } from 'antd'
import enUS from 'antd/locale/en_US';
import { useEffect } from 'react';

export default () => {
  const { token } = theme.useToken();
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
        const params = new URLSearchParams(window.location.search)
        const redirectTo = params.get('redirect') || '/'
        navigate({ to: redirectTo, replace: true })
    }
  }, [auth.isAuthenticated])

  return (
    <ConfigProvider locale={enUS}>
        <ProConfigProvider hashed={false}>
            <div style={{ 
                backgroundColor: token.colorBgContainer,
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
                }}>
                <LoginForm<LoginParams>
                    title="Login"
                    onFinish={async (values) => {
                        await handleAdminLogin(values, auth.login);
                    }}
                >
                    <div
                    
                    style={{ paddingTop: 15 }}>
                        <ProFormText
                        name="username"
                        fieldProps={{
                            size: 'large',
                            prefix: <UserOutlined className={'prefixIcon'} />,
                        }}
                        placeholder={'Username'}
                        rules={[
                            {
                            required: true,
                            message: 'Username is required!',
                            },
                        ]}
                        />
                        <ProFormText.Password
                        name="password"
                        fieldProps={{
                            size: 'large',
                            prefix: <LockOutlined className={'prefixIcon'} />,
                        }}
                        placeholder={'Password'}
                        rules={[
                            {
                            required: true,
                            message: 'Password is required！',
                            },
                        ]}
                        />
                    </div>
                </LoginForm>
            </div>
        </ProConfigProvider>
    </ConfigProvider>
  );
};