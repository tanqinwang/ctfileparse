<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import BlobDownloadButton from '../components/BlobDownloadButton.vue'
import PlayerOverlay from '../components/PlayerOverlay.vue'
import AltchaGate from '../components/AltchaGate.vue'
import { exchangeAuthCode, getByID } from '../lib/ctfile.js'
import { parseLinkInput } from '../lib/linkParser.js'
import { saveHistoryRecord } from '../lib/history.js'
import { getPref, setPref } from '../lib/prefs.js'
import { bytesToSize, secToTime, sizeToBytes, sleep } from '../lib/util.js'

const route = useRoute()
const router = useRouter()

const DEFAULT_MSG = '城通网盘解析器～(∠・ω< )⌒☆'
const TOKEN_PLACEHOLDER = '等待登录...'

const barMessage = ref(DEFAULT_MSG)
const barIcon = ref('/icon.webp')
const barColor = ref('#ffffff')

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
const fileSize = ref('加载中...')
const fileDate = ref('加载中...')
const speedText = ref('加载中...')
const timeText = ref('加载中...')

const resultReady = ref(false)
const playSrc = ref('')
const showPlayer = ref(false)
const showCaptcha = ref(false)
const captchaUnsupported = ref('')

const previewFormats = ['mp4', 'webm', 'mp3', 'flac', 'wav', 'opus', 'ogg', 'aac', 'm4a']

const canPlay = computed(() => {
  const parts = filename.value.split('.')
  if (parts.length < 2) return false
  return previewFormats.includes(parts[parts.length - 1].toLowerCase())
})

function setBar(msg, icon = '/icon.webp', color = '#ffffff', restoreMs = 0) {
  barMessage.value = msg
  barIcon.value = icon
  barColor.value = color
  if (restoreMs) setTimeout(restoreBar, restoreMs)
}

function restoreBar() {
  barMessage.value = DEFAULT_MSG
  barIcon.value = '/icon.webp'
  barColor.value = '#ffffff'
}

function effectiveToken() {
  const t = token.value.trim()
  if (!t || t === TOKEN_PLACEHOLDER || t === '登录中...') return ''
  return t
}

function onLinkChange() {
  const parsed = parseLinkInput(fileId.value)
  if (parsed.error) {
    setBar(parsed.error, '/icon/error.svg', 'rgba(232,48,21,0.6)', 3000)
    return
  }
  if (parsed.fileId) fileId.value = parsed.fileId
  if (parsed.shareRef) shareRef.value = parsed.shareRef
  if (parsed.password != null) {
    password.value = parsed.password
    autopassActive.value = false
  }
  if (parsed.message) setBar(parsed.message, '/icon/password.svg', '#86C166', 3000)
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
  fileSize.value = '加载中...'
  fileDate.value = '加载中...'
  speedText.value = '加载中...'
  timeText.value = '加载中...'
  resultReady.value = false
  showPlayer.value = false
  playSrc.value = ''
}

async function runParse(altchaToken = '') {
  if (!altchaToken) {
    resetResult()
    showCaptcha.value = false
    captchaUnsupported.value = ''
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
        captchaUnsupported.value = file.captchaType
        showCaptcha.value = false
        setBar(`暂不支持 ${file.captchaType} 验证，请在城通官网完成下载`, '/icon/error.svg', 'rgba(232,48,21,0.6)', 8000)
      } else {
        showCaptcha.value = true
        setBar(file.errormsg, '/icon/privacy.svg', '#FB966E')
      }
      showFileInfo.value = false
      return
    }

    showCaptcha.value = false

    if (file.success) {
      dllink.value = file.link
      resultReady.value = true
      try {
        const u = new URL(file.link)
        const speed = Number(u.searchParams.get('spd')) * Number(u.searchParams.get('limit'))
        speedText.value = speed ? `${bytesToSize(speed)}/s` : '无上限'
        timeText.value = speed
          ? secToTime(sizeToBytes(file.size) / Number(speed))
          : '取决于网速'
      } catch {
        speedText.value = '—'
        timeText.value = '—'
      }
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
      setBar(file.errormsg, '/icon/error.svg', 'rgba(232,48,21,0.6)', 5000)
      showFileInfo.value = false
    }
  } catch (err) {
    setBar(err?.message || '解析异常', '/icon/error.svg', 'rgba(232,48,21,0.6)', 5000)
    showFileInfo.value = false
  } finally {
    nameLoading.value = false
    linkLoading.value = false
    parsing.value = false
  }
}

function localParse() {
  return runParse('')
}

function onAltchaToken(token) {
  runParse(token)
}

async function copyLink() {
  if (!dllink.value) return
  try {
    await navigator.clipboard.writeText(dllink.value)
    setBar('已复制链接', '/icon/copy.svg', '#86C166', 3000)
  } catch {
    setBar('复制失败，请手动复制', '/icon/copy.svg', 'rgba(232,48,21,0.6)')
  }
}

function openLink() {
  if (dllink.value) window.open(dllink.value, '_blank')
}

function startPlay() {
  playSrc.value = dllink.value
  showPlayer.value = true
}

watch(node, (v) => setPref('node', v))
watch(token, (v) => {
  if (v && v !== TOKEN_PLACEHOLDER && v !== '登录中...') setPref('token', v)
})

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
      setBar('登录失败', '/icon/error.svg', 'rgba(232,48,21,0.6)', 5000)
    }
    return
  }

  const qFile = route.query.file
  if (qFile) {
    fileId.value = String(qFile)
    password.value = route.query.pass ? String(route.query.pass) : ''
    await localParse()
  }
}

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
        <span class="act-icon" style="background-image: url(/icon/history.svg)" />
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
      <input v-model="password" class="field" placeholder="密码" aria-label="密码" @input="autopassActive = false" />
      <button
        type="button"
        class="input-action"
        :class="{ active: autopassActive }"
        title="填充默认密码"
        aria-label="填充默认密码"
        @click="fillDefaultPass"
      />
    </div>
    <div class="inputdiv">
      <input v-model="token" class="field" placeholder="Token" aria-label="Token" />
      <button type="button" class="input-action login" title="登录" aria-label="登录" @click="goLogin" />
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
      <button type="button" class="parse-btn" :disabled="parsing" @click="localParse">
        <span class="btn-icon" style="background-image: url(/icon/local.svg)" />
        本地解析
      </button>
    </div>

    <AltchaGate :open="showCaptcha" @token="onAltchaToken" @failed="showCaptcha = true" />

    <section v-if="showFileInfo" class="fileinfo">
      <div class="inputdiv">
        <input v-model="filename" class="field" readonly placeholder="文件名" />
        <span v-if="nameLoading" class="input-loading" />
      </div>
      <div class="half-row">
        <p>体积：{{ fileSize }}</p>
        <p>日期：{{ fileDate }}</p>
      </div>
      <div class="inputdiv">
        <input v-model="dllink" class="field" readonly placeholder="下载地址" />
        <span v-if="linkLoading" class="input-loading" />
      </div>
      <div class="half-row">
        <p>限速：{{ speedText }}</p>
        <p>耗时：{{ timeText }}</p>
      </div>
    </section>

    <div v-if="resultReady" class="downdiv">
      <button v-if="canPlay" type="button" class="dl-btn" @click="startPlay">
        <img alt="" src="/icon/play.svg" class="dl-btn-icon" />
        <span class="dl-btn-title">在线播放</span>
      </button>
      <button type="button" class="dl-btn" @click="openLink">
        <img alt="" src="/icon/open.svg" class="dl-btn-icon" />
        <span class="dl-btn-title">新标签打开</span>
      </button>
      <button type="button" class="dl-btn" @click="copyLink">
        <img alt="" src="/icon/copy.svg" class="dl-btn-icon" />
        <span class="dl-btn-title">复制链接</span>
      </button>
      <BlobDownloadButton :link="dllink" :filename="filename" />
    </div>

    <p class="hint">本站仅使用官方 API 解析直连下载地址，并不能突破官方限速。请搭配 IDM 等工具实现大文件断点续传。</p>
  </main>

  <PlayerOverlay v-if="showPlayer" :src="playSrc" @close="showPlayer = false" />
</template>
