import { verifyAdminReq } from "@/apis/admin";
import { req } from "@/config/req";
import { message } from "antd";

export type LoginParams = {
  username: string,
  password: string,
}

export const handleAdminLogin = async (
  values: LoginParams,
  login: (user: { username: string, role: string, id: string }) => void
): Promise<boolean> => {
  const { username, password } = values;
  const encodedPassword = btoa(password);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const logEvent = (success: boolean, userId?: string) => {
    void fetch(`${baseUrl}/api/internal/log-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        user: username,
        userId: userId || '',
        logStatus: success ? 'success' : 'failed',
      }),
    }).catch(() => {});
  };
  const isValid = await verifyAdminReq(req, username, encodedPassword);

  if (!isValid) {
    message.error('Sai tài khoản hoặc mật khẩu');
    logEvent(false);
    return false;
  }

  message.success('Đăng nhập thành công');
  login(isValid);
  logEvent(true, isValid?.id);
  
  return true;
};
