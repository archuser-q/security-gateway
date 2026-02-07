/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { AxiosInstance } from "axios";
import type { APISIXType } from "@/types/schema/apisix";
import type { PageSearchType } from "@/types/schema/pageSearch";
import { API_ADMINS, PAGE_SIZE_MAX, PAGE_SIZE_MIN } from "@/config/constant";

export const verifyAdminReq = async (
  req: AxiosInstance,
  username: string,
  password: string
): Promise<boolean> => {
  const res = await getAdminListReq(req, {
    page: 1,
    page_size: PAGE_SIZE_MAX,
  });

  return res.list.some(({ value }) =>
    value.username === username &&
    value.password === password &&
    value.status === true
  );
};

export const getAdminListReq = (
    req: AxiosInstance,
    params: PageSearchType
) => 
    req
        .get<unknown, APISIXType['RespAdminList']>(API_ADMINS, {
            params,
        })
        .then((v) => v.data);

export const getAdminReq = (req: AxiosInstance, id: string) =>
    req
        .get<unknown, APISIXType['RespAdminDetail']>(
            `${API_ADMINS}/${id}`  
        )
        .then((v) => v.data);

export const postAdminReq = (req: AxiosInstance, data: APISIXType['AdminPost']) => 
    req.post<unknown, APISIXType['RespAdminDetail']>(
        API_ADMINS,
        data
    );

export const putAdminReq = (req: AxiosInstance, data: APISIXType['AdminPut']) => {
    return req.put<APISIXType['AdminPut'], APISIXType['RespAdminDetail']>(
        `${API_ADMINS}/${data.id}`,
        data
    );
};

export const deleteAdminReq = (req: AxiosInstance, id: string) => {
    return req.delete(`${API_ADMINS}/${id}`);
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
            res.list.map((d) => deleteAdminReq(req, d.value.id))
        );
    }
};