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
import { Anchor, type AnchorProps, Button, type ButtonProps } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';

const MantineBtnLinkComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <Button ref={ref} {...props} />;
  }
);
MantineBtnLinkComponent.displayName = 'RouteLinkBtn';

export const RouteLinkBtn = createLink(MantineBtnLinkComponent);

// Giống hyperlink "test-ratelimit@docker" / "my-custom-service" mà Traefik
// dùng trong sơ đồ Router detail - chữ bấm được, không phải nút bấm.
const MantineAnchorLinkComponent = forwardRef<HTMLAnchorElement, AnchorProps>(
  (props, ref) => {
    return <Anchor ref={ref} {...props} />;
  }
);
MantineAnchorLinkComponent.displayName = 'RouteLinkAnchor';

export const RouteLinkAnchor = createLink(MantineAnchorLinkComponent);
