<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'HomeView' })
import TopBar from '../components/TopBar.vue'
import BlobDownloadButton from '../components/BlobDownloadButton.vue'
import PlayerOverlay from '../components/PlayerOverlay.vue'
import AltchaGate from '../components/AltchaGate.vue'
import { exchangeAuthCode, getByID } from '../lib/ctfile.js'
import { parseLinkInput } from '../lib/linkParser.js'
import { saveHistoryRecord } from '../lib/history.js'
import { getPref, setPref } from '../lib/prefs.js'
import { asset } from '../lib/assets.js'
import { speedAndEtaFromLink } from '../lib/downloadMeta.js'
import { sleep } from '../lib/util.js'

const route = useRoute()
const router = useRouter()

const DEFAULT_MSG = '城通网盘 · 直连解析'
const TOKEN_PLACEHOLDER = '等待登录...'
const LOADING = '加载中...'
const PREVIEW_EXT = new Set(['mp4', 'webm', 'mp3', 'flac', 'wav', 'opus', 'ogg', 'aac', 'm4a'])

const barMessage = ref(DEFAULT_MSG)
const barIcon = ref(asset('icon.webp'))
const barColor = ref('#fff8f0')

const fileId = ref('')
const password = ref('')
const token = ref(getPref('token') || TOKEN_PLACEHOLDER)
const node = ref(getPref('node') || 'dx')
const autopassActive = ref(false)
const shareRef = ref('')

const parsing = ref(false)
const nameLoading = ref(false)
const linkLoading = ref(false)
const showFileInfo = ref(false)

const filename = ref('')
const dllink = ref('')
const fileSize = ref(LOADING)
const fileDate = ref(LOADING)
const speedText = ref(LOADING)
const timeText = ref(LOADING)

const resultReady = ref(false)
const playSrc = ref('')
const showPlayer = ref(false)
const showCaptcha = ref(false)

let barRestoreTimer = 0

const canPlay = computed(() => {
  const ext = filename.value.split('.').pop()?.toLowerCase()
  return ext ? PREVIEW_EXT.has(ext) : false
})

function setBar(msg, icon = asset('icon.webp'), color = '#fff8f0', restoreMs = 0) {
  barMessage.value = msg
  barIcon.value = icon
  barColor.value = color
  if (barRestoreTimer) {
    clearTimeout(barRestoreTimer)
    barRestoreTimer = 0
  }
  if (restoreMs) {
    barRestoreTimer = window.setTimeout(() => {
      barRestoreTimer = 0
      restoreBar()
    }, restoreMs)
  }
}

function restoreBar() {
  barMessage.value = DEFAULT_MSG
  barIcon.value = asset('icon.webp')
  barColor.value = '#fff8f0'
}

function effectiveToken() {
  const t = token.value.trim()
  if (!t || t === TOKEN_PLACEHOLDER || t === '登录中...') return ''
  return t
}

function onLinkChange() {
  const parsed = parseLinkInput(fileId.value)
  if (parsed.error) {
    setBar(parsed.error, asset('icon/error.svg'), 'rgba(232,48,21,0.15)', 3000)
    return
  }
  if (parsed.fileId) fileId.value = parsed.fileId
  if (parsed.shareRef) shareRef.value = parsed.shareRef
  if (parsed.password != null) {
    password.value = parsed.password
    autopassActive.value = false
  }
  if (parsed.message) setBar(parsed.message, asset('icon/password.svg'), '#e8f5e9', 3000)
}

async function fillDefaultPass() {
  password.value = '547873715'
  await sleep(10)
  autopassActive.value = true
}

function goLogin() {
  location.replace(`https://www.ctfile.com/p/login?ref=${encodeURIComponent(location.origin)}`)
}

function resetResult() {
  filename.value = ''
  dllink.value = ''
  fileSize.value = LOADING
  fileDate.value = LOADING
  speedText.value = LOADING
  timeText.value = LOADING
  resultReady.value = false
  showPlayer.value = false
  playSrc.value = ''
}

async function runParse(altchaToken = '') {
  if (!altchaToken) {
    resetResult()
    showCaptcha.value = false
  }

  showFileInfo.value = true
  nameLoading.value = true
  linkLoading.value = true
  parsing.value = true

  try {
    const file = await getByID(
      fileId.value.trim(),
      password.value,
      effectiveToken(),
      (meta) => {
        nameLoading.value = false
        filename.value = meta.name
        fileSize.value = meta.size
        fileDate.value = meta.time
      },
      node.value,
      altchaToken,
      shareRef.value,
    )

    if (file.needsCaptcha) {
      if (file.captchaType && file.captchaType !== 'altcha') {
        showCaptcha.value = false
        setBar(
          `暂不支持 ${file.captchaType} 验证，请在城通官网完成下载`,
          asset('icon/error.svg'),
          'rgba(232,48,21,0.15)',
          8000,
        )
      } else {
        showCaptcha.value = true
        setBar(file.errormsg, asset('icon/privacy.svg'), '#fff3e8')
      }
      showFileInfo.value = false
      return
    }

    showCaptcha.value = false

    if (file.success) {
      dllink.value = file.link
      resultReady.value = true
      const eta = speedAndEtaFromLink(file.link, file.size)
      speedText.value = eta.speedText
      timeText.value = eta.timeText
      saveHistoryRecord({
        link: fileId.value.trim(),
        password: password.value,
        queryTime: new Date().toLocaleString(),
        name: file.name,
        size: file.size,
        time: file.time,
      })
      restoreBar()
    } else {
      setBar(file.errormsg, asset('icon/error.svg'), 'rgba(232,48,21,0.15)', 5000)
      showFileInfo.value = false
    }
  } catch (err) {
    setBar(err?.message || '解析异常', asset('icon/error.svg'), 'rgba(232,48,21,0.15)', 5000)
    showFileInfo.value = false
  } finally {
    nameLoading.value = false
    linkLoading.value = false
    parsing.value = false
  }
}

async function copyLink() {
  if (!dllink.value) return
  try {
    await navigator.clipboard.writeText(dllink.value)
    setBar('已复制链接', asset('icon/copy.svg'), '#e8f5e9', 3000)
  } catch {
    setBar('复制失败，请手动复制', asset('icon/copy.svg'), 'rgba(232,48,21,0.15)')
  }
}

function openLink() {
  if (dllink.value) window.open(dllink.value, '_blank')
}

function startPlay() {
  playSrc.value = dllink.value
  showPlayer.value = true
}

async function handleRouteQuery() {
  const authCode = route.query.auth_code
  if (authCode) {
    token.value = '登录中...'
    const resp = await exchangeAuthCode(String(authCode))
    if (resp.code === 200) {
      token.value = resp.session_id
      setPref('token', resp.session_id)
      router.replace({ path: '/', query: {} })
    } else {
      token.value = TOKEN_PLACEHOLDER
      setBar('登录失败', asset('icon/error.svg'), 'rgba(232,48,21,0.15)', 5000)
    }
    return
  }

  const qFile = route.query.file
  if (qFile) {
    fileId.value = String(qFile)
    password.value = route.query.pass ? String(route.query.pass) : ''
    await runParse('')
  }
}

watch(node, (v) => setPref('node', v))
watch(token, (v) => {
  if (v && v !== TOKEN_PLACEHOLDER && v !== '登录中...') setPref('token', v)
})

watch(
  () => route.query,
  () => {
    if (route.name === 'home') handleRouteQuery()
  },
)

onMounted(async () => {
  if (!getPref('node')) setPref('node', 'dx')
  await handleRouteQuery()
})
</script>

<template>
  <TopBar :message="barMessage" :icon="barIcon" :bg-color="barColor">
    <template #actions>
      <RouterLink class="act-btn" to="/history" aria-label="历史记录">
        <img class="act-icon" :src="asset('icon/history.svg')" alt="" />
      </RouterLink>
    </template>
  </TopBar>

  <main class="main">
    <div class="inputdiv">
      <input
        v-model="fileId"
        class="field"
        placeholder="链接或文件 ID"
        aria-label="链接或文件 ID"
        @change="onLinkChange"
      />
    </div>
    <div class="inputdiv">
      <input
        v-model="password"
        class="field"
        placeholder="密码"
        aria-label="密码"
        @input="autopassActive = false"
      />
      <button
        type="button"
        class="input-action"
        :class="{ active: autopassActive }"
        title="填充默认密码"
        aria-label="填充默认密码"
        @click="fillDefaultPass"
      >
        <img :src="asset('icon/optimize.svg')" alt="" />
      </button>
    </div>
    <div class="inputdiv">
      <input v-model="token" class="field" placeholder="Token" aria-label="Token" />
      <button type="button" class="input-action" title="登录" aria-label="登录" @click="goLogin">
        <img :src="asset('icon/login.svg')" alt="" />
      </button>
    </div>
    <div class="inputdiv">
      <select v-model="node" class="field" aria-label="首选节点">
        <option value="dx">电信</option>
        <option value="yd">移动</option>
        <option value="lt">联通</option>
        <option value="us">北美</option>
      </select>
    </div>

    <div class="parse-row">
      <button type="button" class="parse-btn" :disabled="parsing" @click="runParse('')">
        <img class="btn-icon" :src="asset('icon/local.svg')" alt="" />
        本地解析
      </button>
    </div>

    <AltchaGate :open="showCaptcha" @token="runParse" @failed="showCaptcha = true" />

    <section v-if="showFileInfo" class="fileinfo">
      <div class="inputdiv">
        <input v-model="filename" class="field" readonly placeholder="文件名" />
        <img v-if="nameLoading" class="input-loading" :src="asset('icon/loading.svg')" alt="" />
      </div>
      <div class="half-row">
        <p>体积：{{ fileSize }}</p>
        <p>日期：{{ fileDate }}</p>
      </div>
      <div class="inputdiv">
        <input v-model="dllink" class="field" readonly placeholder="下载地址" />
        <img v-if="linkLoading" class="input-loading" :src="asset('icon/loading.svg')" alt="" />
      </div>
      <div class="half-row">
        <p>限速：{{ speedText }}</p>
        <p>耗时：{{ timeText }}</p>
      </div>
    </section>

    <div v-if="resultReady" class="downdiv">
      <button v-if="canPlay" type="button" class="dl-btn" title="在当前页播放音视频" @click="startPlay">
        <img class="dl-btn-icon" :src="asset('icon/play.svg')" alt="" />
        <span class="dl-btn-title">在线播放</span>
      </button>
      <button
        type="button"
        class="dl-btn"
        title="在新标签打开城通 CDN；视频/图片等可能在线预览，不一定会弹出保存"
        @click="openLink"
      >
        <img class="dl-btn-icon" :src="asset('icon/open.svg')" alt="" />
        <span class="dl-btn-title">CDN 直连</span>
      </button>
      <button type="button" class="dl-btn" title="复制直连 URL，可粘贴到 IDM、迅雷等下载工具" @click="copyLink">
        <img class="dl-btn-icon" :src="asset('icon/copy.svg')" alt="" />
        <span class="dl-btn-title">复制链接</span>
      </button>
      <BlobDownloadButton :link="dllink" :filename="filename" />
    </div>

    <p v-if="resultReady" class="download-hint">
      <strong>CDN 直连</strong>：等同手动打开链接，浏览器可能预览而非下载。
      <strong>保存到本地</strong>：在页面内拉取并保存（受跨域与内存限制）。
      大文件建议 <strong>复制链接</strong> 配合 IDM 等断点续传。
    </p>

    <p class="hint">本站仅使用官方 API 解析直连地址，不能突破官方限速。</p>
  </main>

  <PlayerOverlay v-if="showPlayer" :src="playSrc" @close="showPlayer = false" />
</template>
