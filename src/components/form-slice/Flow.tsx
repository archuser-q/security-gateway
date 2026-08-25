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
import { IconArrowRight } from '@tabler/icons-react';
import { Fragment, type ReactNode } from 'react';

import { FormSection } from '@/components/form-slice/FormSection';

export type FlowBoxItem = {
  key: string;
  title: string;
  content: ReactNode;
};

type FlowProps = {
  title?: string;
  boxes: FlowBoxItem[];
  extra?: ReactNode;
};

export const Flow = ({ title = 'Overview', boxes, extra }: FlowProps) => {
  return (
    <FormSection legend={title}>
      <div className="flex flex-nowrap items-stretch gap-1 overflow-x-auto pb-1">
        {boxes.map((box, i) => (
          <Fragment key={box.key}>
            {i > 0 && (
              <div className="flex shrink-0 items-center justify-center px-1 text-gray-300">
                <IconArrowRight size={20} stroke={1.75} />
              </div>
            )}
            <div className="min-w-[220px] flex-1 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-700">{box.title}</div>
              <div className="space-y-2">{box.content}</div>
            </div>
          </Fragment>
        ))}
      </div>
      {extra}
    </FormSection>
  );
};

export const FlowRow = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">
      {value === undefined || value === null || value === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        value
      )}
    </span>
  </div>
);