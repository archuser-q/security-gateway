import { verifyAdminReq } from "@/apis/admin";
import { req } from "@/config/req";
import { message } from "antd";

export type LoginParams = {
  username: string,
  password: string,
}

export const handleAdminLogin = async (
  values: LoginParams,
  login: (user: { id: string, username: string, role: string }) => void
): Promise<boolean> => {
  const { username, password } = values;

  const isValid = await verifyAdminReq(req, username, password);
  if (!isValid) {
    message.error('Sai tài khoản hoặc mật khẩu');
    return false;
  }

  message.success('Đăng nhập thành công');
  login(isValid);
  return true;
};