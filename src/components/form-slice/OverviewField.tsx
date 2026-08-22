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
 * Shared building blocks for "Overview" FormSections (Service, Proto,
 * GlobalRule, and any future resource that gets one) — extracted here
 * because the exact same label/value markup was copy-pasted
 * identically across those files. StreamRouteFlow is deliberately
 * NOT built on these: it's a connected-box flow diagram, a genuinely
 * different visual shape, and forcing it through this abstraction
 * would make both harder to read for no real reuse benefit.
 */

/** Label-above-value field, used in the top summary grid of an Overview section. */
export const SummaryField = ({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-[15px] font-semibold text-gray-800">
      {children === undefined || children === null || children === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        children
      )}
    </span>
  </div>
);

/** Label-left-value-right row with a bottom divider, used inside a bordered info card (e.g. the Upstream card in ServiceSummaryBar). */
export const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex justify-between border-b border-gray-100 py-2 last:border-b-0">
    <span className="text-[13.5px] text-gray-500">{label}</span>
    <span className="text-[13.5px] font-semibold text-gray-800">
      {value === undefined || value === null || value === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        value
      )}
    </span>
  </div>
);

/** The recurring "grid of SummaryFields" wrapper — same auto-fit/gap sizing used at the top of every Overview section. */
export const SummaryGrid = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4 ${className}`}
  >
    {children}
  </div>
);