import { verifyAdminReq } from "@/apis/admin";
import { req } from "@/config/req";
import { message } from "antd";

export type LoginParams = {
  username: string,
  password: string,
}

export const handleAdminLogin = async (
  values: LoginParams,
  login: (user: { username: string, role:string, id:string }) => void
): Promise<boolean> => {
  const { username, password } = values;
  const encodedPassword = btoa(password);

  const isValid = await verifyAdminReq(req, username, encodedPassword);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  try {
    fetch(`${baseUrl}/api/internal/log-event`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'X-Log-Event': 'AdminLogin',
        'X-Log-User': username,
        'X-Log-Status': isValid ? 'Success' : 'Failure'
      },
      body: JSON.stringify({})
    }).catch(() => {});
  } catch (e) {}

  if (!isValid) {
    message.error('Sai tài khoản hoặc mật khẩu');
    return false;
  }

  message.success('Đăng nhập thành công');
  login(isValid); 
  return true;
};
