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
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Admin key with persistent storage
export const adminKeyAtom = atomWithStorage<string>(
  'settings:adminKey',
  'edd1c9f034335f136f87ad84b625c8f1',
  undefined,
  {
    getOnInit: true,
  }
);

// Settings modal visibility state
export const isSettingsOpenAtom = atom<boolean>(false);

export const CLICKHOUSE_URL = import.meta.env.VITE_CLICKHOUSE_API_BASE_URL
export const CLICKHOUSE_TABLE_REQUEST = import.meta.env.VITE_CLICKHOUSE_TABLE_REQUEST
export const CLICKHOUSE_TABLE_LOGIN = import.meta.env.VITE_CLICKHOUSE_TABLE_LOGIN
export const CLICKHOUSE_USER = import.meta.env.VITE_CLICKHOUSE_USER
export const CLICKHOUSE_PASS = import.meta.env.VITE_CLICKHOUSE_PASS