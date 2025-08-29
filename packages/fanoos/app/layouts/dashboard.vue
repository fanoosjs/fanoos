<script setup lang="ts"></script>

<template>
  <UDashboardGroup class="pt-18">
    <UDashboardSidebar resizable>
      <AppTree />
    </UDashboardSidebar>
    <UDashboardPanel>
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
