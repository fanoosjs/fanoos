<script setup lang="ts">
import type { TreeItem } from '#ui/types';

const { data } = useFetch<TreeItem[]>('/api/scanner/tree', {
  lazy: true,
  server: false,
});
</script>

<template>
  <UTree
    :items="data"
  >
    <template #item-label="{ item }">
      <div v-if="item.children" class="text-left">
        {{ item.label }}
      </div>
      <NuxtLink v-else :to="`/tree/${item.path}`" class="w-full text-left block">
        {{ item.label }}
      </NuxtLink>
    </template>
  </UTree>
</template>
