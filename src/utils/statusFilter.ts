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

export type StatusFilterValue = 'all' | 'enabled' | 'disabled';

/** Helper dùng chung: lọc 1 mảng item có value.status theo StatusFilterValue. */
export const filterByStatus = <T extends { value: { status?: 0 | 1 } }>(
  list: T[],
  status: StatusFilterValue
): T[] => {
  if (status === 'all') return list;
  // Theo tài liệu APISIX: status mặc định là 1 (enabled) nếu không set,
  // 0 mới là disabled - không phải "phải đúng bằng 1 mới enabled". Bản
  // cũ lọc Enabled bằng "=== 1" nên bỏ sót mọi resource không có field
  // status (undefined) dù APISIX coi các resource đó là đang enabled.
  return list.filter((item) =>
    status === 'enabled' ? item.value.status !== 0 : item.value.status === 0
  );
};
