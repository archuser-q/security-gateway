import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormText,
} from '@ant-design/pro-components';
import { ConfigProvider, message, theme } from 'antd'
import enUS from 'antd/locale/en_US';

export default () => {
  const { token } = theme.useToken();

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
                <LoginForm
                    title="Login"
                    contentStyle={{
                        marginTop: 24,
                }}
                onFinish={async (values) => {
                    const { username, password } = values;
                    const encodedPassword = btoa(password);
                    const admins = [
                        {
                        username: 'hello',
                        password: 'MTIzNA==',
                        status: true,
                        },
                        {
                        username: 'eee',
                        password: 'ZWVlMTIz',
                        status: true,
                        },
                    ];
                    const matchedAdmin = admins.find(
                        (admin) =>
                        admin.username === username &&
                        admin.password === encodedPassword &&
                        admin.status === true
                    );

                    if (matchedAdmin) {
                        localStorage.setItem('token', 'fake-jwt-token');
                        localStorage.setItem('user', JSON.stringify(matchedAdmin));

                        const params = new URLSearchParams(window.location.search);
                        const redirectTo = params.get('redirect') || '/';

                        window.location.href = redirectTo;
                        return;
                    }

                    message.error('Sai tài khoản hoặc mật khẩu');
                }}
                >
                    <>
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
                    </>
                </LoginForm>
            </div>
        </ProConfigProvider>
    </ConfigProvider>
  );
};