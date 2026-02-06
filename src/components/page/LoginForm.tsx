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

                    if (username === 'admin' && password === '123456') {
                        localStorage.setItem('token', 'fake-jwt-token');

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
                            strengthText:
                            'Password should contain numbers, letters and special characters, at least 8 characters long.',
                            statusRender: (value) => {
                            const getStatus = () => {
                                if (value && value.length > 12) {
                                return 'ok';
                                }
                                if (value && value.length > 6) {
                                return 'pass';
                                }
                                return 'poor';
                            };
                            const status = getStatus();
                            if (status === 'pass') {
                                return (
                                <div style={{ color: token.colorWarning }}>
                                    Strength: Medium
                                </div>
                                );
                            }
                            if (status === 'ok') {
                                return (
                                <div style={{ color: token.colorSuccess }}>
                                    Strength: Strong
                                </div>
                                );
                            }
                            return (
                                <div style={{ color: token.colorError }}>Strength: weak</div>
                            );
                            },
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