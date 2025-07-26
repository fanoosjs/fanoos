<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="text-2xl text-white">
    {{ route.path }}
  </div>
</template>
