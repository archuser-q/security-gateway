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
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/config/i18n';
import { useAuth } from '@/context/AuthContext';

type routeContext = {
  auth: ReturnType<typeof useAuth>
}

const Root = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <HeadContent />
      <Outlet />
    </I18nextProvider>
  )
}

export const Route = createRootRouteWithContext<routeContext>()({
  component: Root,
});
