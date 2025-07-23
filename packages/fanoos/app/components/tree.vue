<script setup lang="ts">
import { TreeItem, TreeRoot } from 'reka-ui';

const route = useRoute();

const { data } = useFetch<TreeNode[]>('/api/scanner/tree', {
  lazy: true,
  server: false,
});
</script>

<template>
  <div class="py-3">
    <UiScrollArea>
      <TreeRoot
        v-slot="{ flattenItems }"
        class="list-none select-none w-72 max-h-full no-scrollbar overflow-y-scroll bg-dar rounded-lg shadow-sm p-2 text-sm font-medium"
        :items="data"
        :get-key="(item) => item.path"
      >
        <h2 class="font-bold text-sm  px-2 pt-1 pb-3">
          Directory Structure
        </h2>
        <TreeItem
          v-for="item in flattenItems"
          v-slot="{ isExpanded }"
          :key="item._id"
          v-bind="item.bind"
          class="flex justify-between items-center px-2 outline-none "
        >
          <div class="flex">
            <div v-for="n in item.level" :key="n" class="first:invisible first:ml-0 border-l border-white/20 h-7 mr-3 ml-2 last:mr-1" />
          </div>
          <div class="w-full cursor-pointer">
            <div v-if="item.hasChildren" class="flex items-center">
              <Icon
                :name="isExpanded ? 'folder-open' : 'folder'"
                class="text-primary text-xl mx-2"
              />
              <div class="shrink truncate max-w-32">
                {{ item.value.name }}
              </div>
            </div>
            <NuxtLink v-else :to="`/tree/${item.value.path}`" class="flex hover:opacity-80 items-center duration-300 py-1 px-2 rounded-md" :class="{ 'bg-primary/50': route.path === `/tree/${item.value.path}` }">
              <Icon
                class="text-xl  "
                :name="item.value.ext.slice(1) || 'lucide:file'"
              />
              <div class="pl-2 shrink truncate max-w-32">
                {{ item.value.name }}
              </div>
            </NuxtLink>
          </div>
        </TreeItem>
      </TreeRoot>
    </UiScrollArea>
  </div>
</template>
