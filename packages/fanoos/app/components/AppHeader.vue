<script setup lang="ts">
const items = computed(() => [
  // {
  //   label: 'Docs',
  //   to: '/getting-started',
  //   active: route.path.startsWith('/getting-started'),
  // },
  {
    label: 'Issues',
    to: 'https://github.com/fanoosjs/fanoos/isssus',
    target: '_blank',
  },
  {
    label: 'Releases',
    to: 'https://github.com/fanoosjs/fanoos/releases',
    target: '_blank',
  },
]);
</script>

<template>
  <UHeader>
    <template #title>
      <div class="flex items-center gap-2">
        <img src="../assets/images/FanoosJS-logo.png" alt="Fanoos Logo" class="w-12">
        <div class="text-2xl">
          Fanoos
        </div>
      </div>
    </template>

    <UNavigationMenu :items />

    <template #right>
      <UColorModeButton />

      <UButton
        color="neutral"
        variant="ghost"
        to="https://github.com/fanoosjs/fanoos"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
      />
    </template>
  </UHeader>
</template>
