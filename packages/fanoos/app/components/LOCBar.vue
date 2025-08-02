<script lang="ts" setup>
import type { LOC } from '@fanoosjs/core';
import { colors } from '~~/shared/consts/colors';

const { loc, lang } = defineProps<{
  loc: LOC;
  lang: 'ts' | 'js';
}>();
</script>

<template>
  <div class="w-full h-32 rounded-xl *:h-full flex mb-12 overflow-hidden">
    <div :style="{ backgroundColor: colors[lang], width: `${100 * loc.code / loc.total}%` }" class="" />
    <div :style="{ backgroundColor: colors.blankLines, width: `${100 * loc.blank / loc.total}%` }" class="" />
    <div :style="{ backgroundColor: colors.singleLineComment, width: `${100 * (loc.comment.doc + loc.comment.multiLine + loc.comment.singleLine) / loc.total}%` }" class="" />
  </div>
</template>
