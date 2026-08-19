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
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/global.css';
import '@mantine/dates/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { queryClient } from '@/config/queryClient'

import { router } from './config/global';
import { AuthProvider, useAuth } from './context/AuthContext';

// Bảng màu/khoảng bo góc lấy cảm hứng từ giao diện Traefik: nền sáng
// trung tính, accent xanh teal, bo góc mềm, chữ không quá đậm. Đây là
// lớp "học phong cách nhìn" - chỉ đổi ở 1 chỗ này, toàn bộ trang tự
// đồng bộ theo, không cần sửa từng trang.
const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontWeight: '600',
  },
  components: {
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'xs',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
  },
});

const AppRouter = () => {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        <MantineProvider theme={theme}>
          <Notifications />
          <QueryClientProvider client={queryClient}>
            <ModalsProvider>
              <AppRouter />
            </ModalsProvider>
          </QueryClientProvider>
        </MantineProvider>
      </AuthProvider>
    </StrictMode>
  )
}
