import { verifyAdminReq } from "@/apis/admin";
import { req } from "@/config/req";
import { message } from "antd";

export type LoginParams = {
  username: string,
  password: string
}

export const handleAdminLogin = async (
  values: LoginParams,
  login: (user: { username: string }) => void
): Promise<boolean> => {
  const { username, password } = values;
  const encodedPassword = btoa(password);

  const isValid = await verifyAdminReq(req, username, encodedPassword);

  if (!isValid) {
    message.error('Sai tài khoản hoặc mật khẩu');
    return false;
  }

  message.success('Đăng nhập thành công');
  login({ username }); 
  return true;
};
