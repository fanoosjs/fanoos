<script setup lang="ts">
import type { LOC } from '@fanoosjs/core';
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const {loc} = defineProps<{
  loc: LOC
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const total = loc.code + loc.blank +
    loc.comment.singleLine +
    loc.comment.multiLine +
    loc.comment.doc

  const commentTotal =
    loc.comment.singleLine +
    loc.comment.multiLine +
    loc.comment.doc

  const option: echarts.EChartsOption = {
    title: {
      text: `${total}`,
      subtext: 'Total Lines',
      left: 'center',
      top: 'center',
      textStyle: { fontSize: 28, fontWeight: 'bold',color:'#fff' },
      subtextStyle: { fontSize: 14, color: '#fff' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      // Outer ring
      {
        name: 'LOC Breakdown',
        type: 'pie',
        radius: ['40%', '80%'],
        // label: { show: true, position: 'outside' },
        data: [
          { value: loc.code, name: 'Code' },
          { value: commentTotal, name: 'Comment' },
          { value: loc.blank, name: 'Blank' }
        ]
      },
      // Inner ring (only under Comment)
      {
        name: 'Comment Types',
        type: 'pie',
        radius: ['40%', '50%'],
        label: { show: false },
        data: [
          { value: loc.code, name: '', itemStyle: { color: 'transparent' }, },
          { value: loc.comment.singleLine, name: 'Single-line' },
          { value: loc.comment.multiLine, name: 'Multi-line' },
          { value: loc.comment.doc, name: 'Doc' },
          { value: loc.blank, name: '', itemStyle: { color: 'transparent' }, }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
}
onMounted(initChart)

// If props change, update chart
watch(() => loc, () => {
  initChart()
}, { deep: true })
</script>

<template>
  {{ loc }}
  <div class="">
    <div ref="chartRef" style="width: 100%; height: 400px;"></div>
  </div>
</template>
