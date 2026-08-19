import { useAuth } from '@/context/AuthContext';
import { handleAdminLogin, type LoginParams } from '@/utils/auth';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProConfigProvider, ProFormText } from '@ant-design/pro-components';
import { useNavigate } from '@tanstack/react-router';
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US';
import { useEffect } from 'react';

export default () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate({
        to: new URLSearchParams(window.location.search).get('redirect') || '/',
        replace: true,
      });
    }
  }, [auth.isAuthenticated, navigate]);

  return (
    <ConfigProvider locale={enUS}>
      <ProConfigProvider hashed={false}>
        <div className="min-h-[80vh] flex items-center justify-center bg-white">
          
          <LoginForm<LoginParams>
            title="Login"
            onFinish={async (values) => {
              await handleAdminLogin(values, auth.login);
            }}
          >
            <div className="pt-4">
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className="text-gray-400" />,
                }}
                placeholder="Username"
                rules={[{ required: true, message: 'Username is required!' }]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="text-gray-400" />,
                }}
                placeholder="Password"
                rules={[{ required: true, message: 'Password is required!' }]}
              />
            </div>
          </LoginForm>
        </div>
      </ProConfigProvider>
    </ConfigProvider>
  );
};