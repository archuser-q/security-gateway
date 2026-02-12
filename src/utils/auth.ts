import { verifyAdminReq, type LoginResponse } from "@/apis/admin";
import { req } from "@/config/req";
import { message } from "antd";

export const handleAdminLogin = async (
  username: string,
  password: string,
  login: (username: string, password: string, res: LoginResponse) => Promise<void>
): Promise<boolean> => {
  try{
    const encodedPassword = btoa(password);
    const res = await verifyAdminReq(req, username, encodedPassword);

    await login(username, encodedPassword, res);
    message.success("Login successfully");
    return true;
  } catch(err){
    message.error("Wrong username or password");
    return false;
  }
};
