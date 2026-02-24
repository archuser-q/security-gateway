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
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (auth.isAuthenticated) {
        navigate({
        to: new URLSearchParams(window.location.search).get('redirect') || '/',
        replace: true,
        });
    }
  }, [auth.isAuthenticated]);

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
                        const result = await handleAdminLogin(values, auth.login);

                        const status = result ? 'success' : 'fail';

                        await fetch(`${API_URL}/login-history`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: values.username,
                                status,
                            }),
                        });
                    }}
                >
                    <div style={{ paddingTop: 15 }}>
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