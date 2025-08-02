<script setup lang="ts">
import type { LOC } from '@fanoosjs/core';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const sourcePath = computed(() => route.params.dir.join('/'));

const { data } = useFetch<{ loc: LOC }>('/api/analyzer', {
  query: {
    path: sourcePath,
  },
  deep: true,
});
</script>

<template>
  <UPage class="p-12">
    {{ data }}
    <template #right>
      <div class="" />
    </template>
  </UPage>
</template>
