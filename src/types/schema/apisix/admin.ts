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
import { z } from 'zod';
import { APISIXCommon } from './common';

const Admin = z
  .object({
    id: z.string(),
    username: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9_]+$/),
    labels: APISIXCommon.Labels.optional(),
    desc: z.string().optional(),
  })
  .merge(APISIXCommon.Info);

export const APISIXAdmin = {
    Admin,
    AdminPost: Admin.omit({
      id: true,
      create_time: true,
      update_time: true,
    }),
    AdminPut: Admin.omit({
        create_time: true, 
        update_time: true
    })
}