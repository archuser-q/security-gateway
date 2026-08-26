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
import { ConfigProvider } from 'antd';
import type { PropsWithChildren } from 'react';

// Bọc ngoài <ProTable> để có khung bo góc/viền/shadow + header xám nhạt
// giống ảnh mẫu (trang Administrators), và thêm padding cho hàng phân
// trang (cardProps bodyStyle padding=0 ở page component làm bảng dính
// sát viền card cho đẹp, nhưng đồng thời cũng làm luôn hàng phân trang
// bị dính sát viền - cần bù padding lại riêng cho .ant-pagination).
//
// QUAN TRỌNG: mọi class Tailwind nhắm vào phần tử của antd ở đây ĐỀU
// PHẢI có dấu "!" (important). Lý do không phải do độ ưu tiên CSS
// (specificity) thông thường: antd inject CSS-in-JS dạng "không thuộc
// layer nào" (unlayered), còn Tailwind bọc toàn bộ utility trong
// @layer - theo đúng chuẩn CSS Cascade Layers, style KHÔNG thuộc layer
// nào luôn thắng style CÓ thuộc layer bất kể thứ tự nạp hay độ ưu tiên
// selector. Quên "!" ở đâu (như px-4/py-3 bên dưới lúc đầu) là y hệt
// như không viết gì cả - lỗi pagination dính sát viền lần trước là do
// đúng chỗ quên "!" này.
//
// Khoảng cách "Prev 1/2 Next": antd chỉ tự set margin-right cho riêng
// "Prev" (không có margin tương ứng phía "Next"), 2 bên lệch nhau theo
// mặc định. Thay vì dựa vào margin lệch sẵn có đó, tắt hẳn margin của
// "Prev" rồi tự set margin ĐỀU 2 BÊN cho số ở giữa ("1/2") - đảm bảo
// khoảng cách 2 bên luôn bằng nhau, không phụ thuộc margin mặc định
// không đối xứng của antd nữa.
export const ListTableCard = (props: PropsWithChildren) => {
  const { children } = props;
  return (
    <div
      className="
        overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm
        [&_.ant-pro-card]:!rounded-none [&_.ant-pro-card]:!border-none [&_.ant-pro-card]:!shadow-none
        [&_.ant-table-thead>tr>th]:!font-medium
        [&_.ant-pagination]:!mb-0 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:!py-3
        [&_.ant-pagination-total-text]:!mr-auto
        [&_.ant-pagination-prev]:!mr-0 [&_.ant-pagination-simple-pager]:!mx-2
      "
    >
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: '#ffffff',
              headerColor: '#6b7280',
              headerSplitColor: 'transparent',
              borderColor: '#f1f5f9',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </div>
  );
};
