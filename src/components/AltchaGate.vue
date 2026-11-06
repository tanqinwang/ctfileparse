<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { WEBAPI_ORIGIN } from '../lib/ctfile.js'

const H5_ORIGIN = 'https://h5.ctfile.com'

const props = defineProps({
  open: { type: Boolean, default: false },
  apiOrigin: { type: String, default: WEBAPI_ORIGIN },
})

const emit = defineEmits(['token', 'failed'])

const frameKey = ref(0)
const status = ref('loading')

const iframeSrc = computed(() => {
  const url = new URL(`${H5_ORIGIN}/captcha/altcha.html`)
  url.searchParams.set('action', 'api_passcode')
  url.searchParams.set('source', 'ctfile_api')
  url.searchParams.set('lang', 'zh-hans')
  url.searchParams.set('theme', 'light')
  url.searchParams.set('api', props.apiOrigin)
  return url.href
})

function onMessage(event) {
  if (event.origin !== H5_ORIGIN) return
  const data = event.data
  if (!data || data.source !== 'ctfile-captcha' || data.type !== 'altcha') return

  if (data.event === 'ready' || data.event === 'interactive') {
    status.value = 'ready'
  } else if (data.event === 'success') {
    const token = typeof data.token === 'string' ? data.token : ''
    if (token) {
      status.value = 'done'
      emit('token', token)
    }
  } else if (data.event === 'expired' || data.event === 'error') {
    status.value = 'failed'
    emit('failed', data.error || 'captcha_error')
  }
}

function retry() {
  status.value = 'loading'
  frameKey.value += 1
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      status.value = 'loading'
      frameKey.value += 1
    }
  },
)

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <section v-if="open" class="altcha-panel">
    <p class="altcha-hint">城通要求人机验证，验证通过后将自动继续解析。</p>
    <div class="altcha-box">
      <iframe
        :key="frameKey"
        :src="iframeSrc"
        title="人机验证"
        class="altcha-frame"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerpolicy="no-referrer"
      />
      <p v-if="status === 'loading'" class="altcha-status">正在加载验证组件…</p>
      <button v-if="status === 'failed'" type="button" class="altcha-retry" @click="retry">重试验证</button>
    </div>
  </section>
</template>

<style scoped>
.altcha-panel {
  margin: 16px 0;
  padding: 12px;
  border: 1px dashed #777;
  border-radius: 8px;
  background: #fafafa;
}
.altcha-hint {
  margin-bottom: 8px;
  color: #444;
}
.altcha-box {
  position: relative;
  min-height: 64px;
}
.altcha-frame {
  width: 100%;
  height: 64px;
  border: 0;
  display: block;
}
.altcha-status {
  font-size: 0.9rem;
  color: #666;
  margin-top: 6px;
}
.altcha-retry {
  margin-top: 8px;
  padding: 6px 14px;
  border: 1px solid #999;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
</style>
