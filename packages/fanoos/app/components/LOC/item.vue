<script setup lang="ts">
defineProps<{
  color: string;
  size: number;
  percentage: number;
}>();
</script>

<template>
  <div :style="{ backgroundColor: color, width: `${percentage}%` }" class="flex items-center justify-center">
    {{ size }}
  </div>
</template>
