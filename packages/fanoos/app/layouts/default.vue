<script setup lang="ts"></script>

<template>
  <div class="bg-dark h-screen overflow-hidden text-gray-50 w-full">
    <div class="max-w-[1440px] mx-auto h-full">
      <Header />
      <div class="flex gap-10 h-full">
        <Tree />
        <slot />
      </div>
    </div>
  </div>
</template>
