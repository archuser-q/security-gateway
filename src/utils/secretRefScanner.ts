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

/**
 * APISIX tham chiếu Secret bằng chuỗi nhúng trong field bất kỳ của plugin,
 * dạng "$secret://{manager}/{id}/{secret_name}/{key}" - đã xác nhận đúng
 * cú pháp này qua tài liệu chính thức apisix.apache.org/docs, không đoán.
 * Vì đây là chuỗi tự do, không phải foreign key, nên không có cách nào
 * tra "chính xác 100%" ai đang dùng - chỉ có thể quét toàn bộ giá trị
 * string lồng trong plugins config xem có khớp tiền tố này không. Đây là
 * best-effort, không phải xác nhận chính thức từ APISIX.
 */
export const buildSecretRefPrefix = (manager: string, id: string): string =>
  `$secret://${manager}/${id}/`;

export const containsSecretRef = (value: unknown, prefix: string): boolean => {
  if (typeof value === 'string') return value.startsWith(prefix);
  if (Array.isArray(value)) return value.some((v) => containsSecretRef(v, prefix));
  if (value && typeof value === 'object') {
    return Object.values(value).some((v) => containsSecretRef(v, prefix));
  }
  return false;
};
