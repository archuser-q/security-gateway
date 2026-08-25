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
import { FormSection } from '@/components/form-slice/FormSection';

type OverviewField = {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
};

type OverviewProps = {
  title?: string;
  fields: OverviewField[];
};

export const Overview = ({ title = 'Overview', fields }: OverviewProps) => {
  return (
    <FormSection legend={title}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <div className="mb-1 text-sm text-gray-400">{field.label}</div>
            <div className={`text-base text-gray-900 ${field.bold === false ? 'font-normal' : 'font-semibold'}`}>
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
};