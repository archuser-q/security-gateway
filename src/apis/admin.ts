import type { AxiosInstance } from "axios";
import type { AdminPostType } from "@/components/form-slice/FormPartAdmin/schema";
import type { APISIXType } from "@/types/schema/apisix";
import type { PageSearchType } from "@/types/schema/pageSearch";
import { API_ADMINS, PAGE_SIZE_MAX, PAGE_SIZE_MIN } from "@/config/constant";

export const getAdminListReq = (
    req: AxiosInstance,
    params: PageSearchType
) => 
    req
        .get<unknown, APISIXType['RespAdminList']>(API_ADMINS, {
            params,
        })
        .then((v) => v.data);

export const getAdminReq = (req: AxiosInstance, username: string) =>
    req
        .get<unknown, APISIXType['RespAdminDetail']>(
            `${API_ADMINS}/${username}`  // ← Sử dụng username làm ID
        )
        .then((v) => v.data);

export const postAdminReq = (req: AxiosInstance, data: AdminPostType) => 
    req.post<unknown, APISIXType['RespAdminDetail']>(
        API_ADMINS,
        data
    );

export const putAdminReq = (req: AxiosInstance, data: APISIXType['AdminPut']) => {
    return req.put<APISIXType['AdminPut'], APISIXType['RespAdminDetail']>(
        `${API_ADMINS}/${data.username}`, 
        data
    );
};

export const deleteAdminReq = (req: AxiosInstance, username: string) => {
    return req.delete(`${API_ADMINS}/${username}`);  
};

export const deleteAllAdmins = async (req: AxiosInstance) => {
    const totalRes = await getAdminListReq(req, {
        page: 1,
        page_size: PAGE_SIZE_MIN,
    });
    
    const total = totalRes.total;
    if (total == 0) return;
    
    for (let times = Math.ceil(total / PAGE_SIZE_MAX); times > 0; times--) {
        const res = await getAdminListReq(req, {
            page: 1,
            page_size: PAGE_SIZE_MAX,
        });
        
        await Promise.all(
            res.list.map((d) => req.delete(`${API_ADMINS}/${d.value.username}`))  
        );
    }
};