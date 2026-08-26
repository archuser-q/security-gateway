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
import type { TablePaginationConfig } from 'antd';
import { useTranslation } from 'react-i18next';

// Antd mặc định gộp total-text + số trang + dropdown page-size thành 1
// cụm dồn hết bên phải. Ảnh mẫu chỉ có "Total N items" bên trái và
// "Prev 1/1 Next" (dạng text, không icon, không ô nhập) bên phải, không
// có dropdown page-size. simple:{readOnly:true} của antd render đúng
// "current/total" dạng CHỮ THƯỜNG (không phải input) khi readOnly=true -
// xem node_modules rc-pagination Pagination.js dòng ~300. itemRender chỉ
// đổi icon mũi tên -> chữ Prev/Next; disabled state ở nút vẫn do chính
// antd tự inject qua cloneElement nên không cần tự viết logic disabled.
// Dùng chung cho 5 trang list thay vì lặp lại object này ở từng trang.
//
// LƯU Ý (đã quên mất 2 lần): mọi class Tailwind chỉnh phần tử do antd
// tạo ra (button trong itemRender bên dưới) ĐỀU PHẢI có dấu "!" -
// antd chèn CSS kiểu "không thuộc layer nào" nên luôn thắng Tailwind
// dù Tailwind có độ ưu tiên selector cao hơn (xem comment chi tiết ở
// ListTableCard.tsx). Quên "!" ở px-3 là nguyên nhân nút Prev/Next
// dính sát chữ "2/2" bên cạnh.
export const useListTablePagination = (
  pagination: TablePaginationConfig
): TablePaginationConfig => {
  const { t } = useTranslation();

  return {
    ...pagination,
    showTotal: (total) => t('table.totalItems', { count: total }),
    showSizeChanger: false,
    simple: { readOnly: true },
    itemRender: (_page, type, originalElement) => {
      if (type === 'prev') {
        return (
          <button type="button" className="ant-pagination-item-link !w-auto !px-3 text-sm">
            {t('table.btn.prev')}
          </button>
        );
      }
      if (type === 'next') {
        return (
          <button type="button" className="ant-pagination-item-link !w-auto !px-3 text-sm">
            {t('table.btn.next')}
          </button>
        );
      }
      return originalElement;
    },
  };
};
