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
<<<<<<< HEAD
import { Drawer } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { Search } from 'lucide-react';
=======
import { Drawer, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
>>>>>>> origin/tai
import { observable, toJS } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { difference } from 'rambdax';
import { useTranslation } from 'react-i18next';
import { useDeepCompareEffect } from 'react-use';

import { deletePluginMetadataReq, putPluginMetadataReq } from '@/apis/plugins';
import type { PluginCardProps } from '@/components/form-slice/FormItemPlugins/PluginCard';
<<<<<<< HEAD
import { PluginCardList } from '@/components/form-slice/FormItemPlugins/PluginCardList';
=======
import {
  PluginCardList,
  PluginCardListSearch,
} from '@/components/form-slice/FormItemPlugins/PluginCardList';
>>>>>>> origin/tai
import {
  type PluginConfig,
  PluginEditorDrawer,
} from '@/components/form-slice/FormItemPlugins/PluginEditorDrawer';
import { SelectPluginsDrawer } from '@/components/form-slice/FormItemPlugins/SelectPluginsDrawer';

import { type PluginInfo, usePluginMetadataList } from './hooks';

export const PluginMetadata = observer(() => {
  const { t } = useTranslation();

  const getMetadataListReq = usePluginMetadataList();
  const putMetadata = useMutation({
    mutationFn: putPluginMetadataReq,
    onSuccess(_, variables) {
      notifications.show({
        message: t('info.edit.success', {
          name: `${t('pluginMetadata.singular')} of ${variables.name}`,
        }),
        color: 'green',
      });
      getMetadataListReq.refetch();
    },
  });
  const deleteMetadata = useMutation({
    mutationFn: (name: string) => deletePluginMetadataReq(name),
    onSuccess(_, name) {
      notifications.show({
        message: t('info.delete.success', {
          name: `${t('pluginMetadata.singular')} of ${name}`,
        }),
        color: 'green',
      });
      getMetadataListReq.refetch();
    },
  });

  const pluginsOb = useLocalObservable(() => ({
    __map: observable.map<string, PluginConfig>(),
    __schemaMap: observable.map<string, object>(),
    init(map: Map<string, PluginInfo>, hasConfigNames: string[]) {
      // we need to clear the map first
      this.__map.clear();
      this.__schemaMap.clear();
      this.allPluginNames = [];
      for (const [name, info] of map.entries()) {
        if (hasConfigNames.includes(name)) {
          this.__map.set(name, info);
        }
        this.__schemaMap.set(name, info.schema);
        this.allPluginNames.push(name);
      }
    },
    delete(name: string) {
      deleteMetadata.mutateAsync(name);
    },
    update(config: PluginConfig) {
      putMetadata.mutateAsync(config);
    },
    allPluginNames: [] as string[],
    get selected() {
      return Array.from(this.__map.keys());
    },
    get unSelected() {
      return difference(this.allPluginNames, this.selected);
    },
    curPlugin: {} as PluginConfig,
    curPluginSchema: {} as object,
    setCurPlugin(name: string) {
      this.curPlugin = this.__map.get(name) || { name, config: {} };
      this.curPluginSchema = this.__schemaMap.get(name)!;
      this.setEditorOpened(true);
    },
    editorOpened: false,
    setEditorOpened(val: boolean) {
      this.editorOpened = val;
    },
    closeEditor() {
      this.setEditorOpened(false);
      this.setSelectPluginsOpened(false);
      this.curPlugin = {} as PluginConfig;
    },
    search: '',
    setSearch(val: string) {
      this.search = val;
    },
    mode: 'edit' as PluginCardProps['mode'],
    selectPluginsOpened: false,
    setSelectPluginsOpened(val: boolean) {
      this.selectPluginsOpened = val;
    },
    on(mode: PluginCardProps['mode'], name: string) {
      this.setCurPlugin(name);
      this.mode = mode;
    },
  }));

  const { pluginInfoMap, hasConfigNames, isLoading } = getMetadataListReq;
  // init the selected plugins
  useDeepCompareEffect(() => {
    if (isLoading) return;
    pluginsOb.init(pluginInfoMap, hasConfigNames);
  }, [pluginInfoMap, hasConfigNames, pluginsOb, isLoading]);

  return (
    <Drawer.Stack>
<<<<<<< HEAD
      {/* Only this toolbar is custom-styled (Tailwind) — PluginCardList
          itself (the actual card grid) is untouched, and stays the
          shared component used by Route/Service/Global Rules/Consumer/
          Credential too. SelectPluginsDrawer's own built-in button is
          hidden via `disabled` and replaced with a Tailwind one below,
          driven by the same MobX state. */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            value={pluginsOb.search}
            onChange={(e) => pluginsOb.setSearch(e.target.value)}
            placeholder={t('pluginMetadata.search')}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm
                       placeholder:text-gray-400 focus:border-teal-500 focus:outline-none
                       focus:ring-1 focus:ring-teal-500"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={() => pluginsOb.setSelectPluginsOpened(true)}
          className="whitespace-nowrap rounded-md bg-teal-600 px-4 py-2 text-sm
                     font-medium text-white transition-colors hover:bg-teal-700"
        >
          {t('form.plugins.selectPlugins.title')}
        </button>
        <SelectPluginsDrawer
          disabled
=======
      <Group>
        <PluginCardListSearch
          search={pluginsOb.search}
          setSearch={pluginsOb.setSearch}
        />
        <SelectPluginsDrawer
>>>>>>> origin/tai
          plugins={pluginsOb.unSelected}
          onAdd={(name) => pluginsOb.on('add', name)}
          opened={pluginsOb.selectPluginsOpened}
          setOpened={pluginsOb.setSelectPluginsOpened}
        />
<<<<<<< HEAD
      </div>
=======
      </Group>
>>>>>>> origin/tai
      <PluginCardList
        mode="edit"
        placeholder={t('pluginMetadata.search')}
        mah="60vh"
        search={pluginsOb.search}
        plugins={pluginsOb.selected}
        onDelete={pluginsOb.delete}
        onEdit={(name) => pluginsOb.on('edit', name)}
      />
      <PluginEditorDrawer
        mode={pluginsOb.mode}
        schema={toJS(pluginsOb.curPluginSchema)}
        opened={pluginsOb.editorOpened}
        onClose={pluginsOb.closeEditor}
        plugin={toJS(pluginsOb.curPlugin)}
        onSave={pluginsOb.update}
      />
    </Drawer.Stack>
  );
<<<<<<< HEAD
});
=======
});
>>>>>>> origin/tai
