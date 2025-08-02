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
      <NuxtLink :to="`/tree/${item.path}`">
        {{ item.label }}
      </NuxtLink>
    </template>
  </UTree>
</template>
