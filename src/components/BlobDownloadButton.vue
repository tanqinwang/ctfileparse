<script setup>
import { computed, ref } from 'vue'
import { asset } from '../lib/assets.js'

const props = defineProps({
  link: { type: String, required: true },
  filename: { type: String, required: true },
})

const emit = defineEmits(['progress', 'done', 'fail'])

const percent = ref(0)
const busy = ref(false)
const status = ref('idle')

const label = computed(() => {
  if (status.value === 'ok') return '下载成功'
  if (status.value === 'fail') return '下载失败'
  if (busy.value) return '下载中'
  return '保存到本地'
})

function download() {
  if (busy.value) return
  busy.value = true
  status.value = 'loading'
  percent.value = 0

  const xhr = new XMLHttpRequest()
  xhr.responseType = 'blob'
  xhr.onprogress = (event) => {
    if (event.total) {
      percent.value = Math.min(100, (event.loaded / event.total) * 100)
      emit('progress', percent.value)
    }
  }
  xhr.onload = () => {
    busy.value = false
    if (xhr.readyState === 4 && xhr.status === 200) {
      const a = document.createElement('a')
      a.download = props.filename
      a.style.display = 'none'
      const blobUrl = URL.createObjectURL(xhr.response)
      a.href = blobUrl
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      status.value = 'ok'
      emit('done')
    } else {
      status.value = 'fail'
      emit('fail', xhr.status)
    }
  }
  xhr.onerror = () => {
    busy.value = false
    status.value = 'fail'
    emit('fail')
  }
  xhr.open('GET', props.link, true)
  xhr.send()
}
</script>

<template>
  <button
    type="button"
    class="dl-btn dl-btn-blob"
    :class="[status, { 'is-busy': busy }]"
    :aria-busy="busy"
    :aria-valuenow="busy ? Math.round(percent) : undefined"
    title="在当前页下载并保存为解析到的文件名；大文件或跨域失败时请用「复制链接」"
    @click="download"
  >
    <div class="dl-progress" :style="{ width: `${percent}%` }" />
    <img class="dl-btn-icon" :src="asset('icon/down.svg')" alt="" />
    <span class="dl-btn-title">{{ label }}</span>
    <span v-if="busy && percent > 0" class="dl-btn-percent">{{ percent.toFixed(0) }}%</span>
  </button>
</template>

<style scoped>
.dl-btn-blob {
  isolation: isolate;
}

.dl-btn-blob.is-busy {
  grid-column: 1 / -1;
}

.dl-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: #a8d8b9;
  z-index: 0;
  transition: width 0.2s ease-out;
  pointer-events: none;
}

.dl-btn-blob .dl-btn-icon,
.dl-btn-blob .dl-btn-title,
.dl-btn-blob .dl-btn-percent {
  position: relative;
  z-index: 1;
}

.dl-btn-percent {
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary-hover);
}

.dl-btn-blob.loading {
  border-color: var(--color-primary);
}

.dl-btn-blob.ok {
  background-color: #86c166;
  border-color: #86c166;
}

.dl-btn-blob.ok .dl-progress {
  width: 100% !important;
  background-color: transparent;
}

.dl-btn-blob.fail {
  background-color: #f17c67;
  border-color: #f17c67;
}
</style>
