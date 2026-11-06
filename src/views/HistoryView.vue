<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import { asset } from '../lib/assets.js'
import { clearHistory, loadHistory, removeHistoryItem } from '../lib/history.js'

const router = useRouter()
const records = ref([])

const reversedRecords = computed(() => [...records.value].reverse())

function refresh() {
  records.value = loadHistory()
}

onMounted(refresh)

function parseRecord(record) {
  router.push({
    path: '/',
    query: { file: record.link, pass: record.password || undefined },
  })
}

function remove(link) {
  removeHistoryItem(link)
  refresh()
}

function clearAll() {
  if (confirm('这将清除所有记录，确认吗？')) {
    clearHistory()
    refresh()
  }
}
</script>

<template>
  <TopBar message="解析历史" :icon="asset('icon/history.svg')" bg-color="#fff8f0">
    <template #actions>
      <RouterLink class="act-btn" to="/" aria-label="返回首页">
        <img class="act-icon" :src="asset('icon/close.svg')" alt="" />
      </RouterLink>
    </template>
  </TopBar>

  <main class="main">
    <nav class="page-nav">
      <RouterLink to="/" class="nav-btn">返回解析</RouterLink>
      <button type="button" class="nav-btn" :disabled="!records.length" @click="clearAll">全部清除</button>
    </nav>

    <p v-if="!records.length" class="history-empty">暂无记录</p>

    <article v-for="r in reversedRecords" :key="r.link + r.queryTime" class="history-card">
      <header class="history-card-head">
        <span>{{ r.name }}</span>
        <button type="button" class="text-btn" @click="parseRecord(r)">解析</button>
      </header>
      <div class="history-card-body">
        <p>大小：{{ r.size }}</p>
        <p>文件时间：{{ r.time }}</p>
        <p>查询于：{{ r.queryTime }}</p>
        <button type="button" class="text-btn danger" @click="remove(r.link)">删除</button>
      </div>
    </article>
  </main>
</template>
