<script setup lang="ts">
import { TreeItem, TreeRoot } from 'reka-ui';

const { data } = useFetch<TreeNode[]>('/api/scanner/tree', {
  lazy: true,
  server: false,
});
</script>

<template>
  <div class="px-10 py-3">
    <TreeRoot
      v-slot="{ flattenItems }"
      class="list-none select-none w-72 bg-dar text-gray-50 rounded-lg shadow-sm p-2 text-sm font-medium"
      :items="data"
      :get-key="(item) => item.path"
    >
      <h2 class="font-bold text-sm text-gray-50 px-2 pt-1 pb-3">
        Directory Structure
      </h2>
      <TreeItem
        v-for="item in flattenItems"
        v-slot="{ isExpanded }"
        :key="item._id"
        :style="{ 'padding-left': `${item.level - 0.5}rem` }"
        v-bind="item.bind"
        class="flex justify-between items-center my-0.5 py-1 px-2 rounded outline-none "
      >
        <div class="flex items-center w-full grow">
          <Icon
            v-if="item.hasChildren"
            name="material-symbols:keyboard-arrow-up"
            class="w-max text-xl"
            :class="isExpanded ? 'rotate-180' : 'rotate-90'"
          />
          <div v-else class="w-5" />
          <Icon
            v-if="item.hasChildren"
            :name="isExpanded ? 'folder-open' : 'folder'"
            class="text-primary text-xl"
          />
          <Icon
            v-else
            class="text-xl"
            :name="item.value.ext.slice(1) || 'lucide:file'"
          />
          <div class="pl-2 shrink truncate max-w-32">
            {{ item.value.name }}
          </div>
        </div>
      </TreeItem>
    </TreeRoot>
  </div>
</template>
