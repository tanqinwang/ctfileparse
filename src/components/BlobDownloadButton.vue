<script setup>
import { ref } from 'vue'

const props = defineProps({
  link: { type: String, required: true },
  filename: { type: String, required: true },
})

const emit = defineEmits(['progress', 'done', 'fail'])

const title = ref('内置下载')
const percent = ref(0)
const busy = ref(false)
const status = ref('idle')

function download() {
  if (busy.value) return
  busy.value = true
  status.value = 'loading'
  title.value = '正在下载'
  percent.value = 0

  const xhr = new XMLHttpRequest()
  xhr.responseType = 'blob'
  xhr.onprogress = (event) => {
    if (event.loaded && event.total) {
      percent.value = Math.min(100, (event.loaded / event.total) * 100)
      title.value = `正在下载 ${percent.value.toFixed(1)}%`
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
      title.value = '下载成功'
      status.value = 'ok'
      emit('done')
    } else {
      title.value = `下载失败: ${xhr.status}`
      status.value = 'fail'
      emit('fail', xhr.status)
    }
  }
  xhr.onerror = () => {
    busy.value = false
    title.value = '连接失败'
    status.value = 'fail'
    emit('fail')
  }
  xhr.open('GET', props.link, true)
  xhr.send()
}
</script>

<template>
  <button type="button" class="dl-btn" :class="status" @click="download">
    <img alt="" src="/icon/down.svg" class="dl-btn-icon" />
    <span class="dl-btn-title">{{ title }}</span>
    <div class="dl-progress" :style="{ width: `${percent}%` }" />
  </button>
</template>

<style scoped>
.dl-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: #a8d8b9;
  z-index: -1;
  transition: width 0.25s ease-in-out;
}
.dl-btn.ok {
  background-color: #86c166;
}
.dl-btn.fail {
  background-color: #f17c67;
}
</style>
