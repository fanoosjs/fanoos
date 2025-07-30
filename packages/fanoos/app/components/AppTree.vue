<script setup lang="ts">
import type { TreeItem } from '#ui/types';

const { data } = useFetch<TreeItem[]>('/api/scanner/tree', {
  lazy: true,
  server: false,
});

const treeItem = ref();
</script>

<template>
  {{ treeItem?.path }}
  <UTree

    v-model="treeItem"
    :items="data"
  />
</template>
