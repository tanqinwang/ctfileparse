<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { clearHistory, loadHistory, removeHistoryItem } from '../lib/history.js'

const router = useRouter()
const records = ref([])

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
  <div class="history-page">
    <nav class="history-nav">
      <RouterLink to="/" class="nav-btn">返回</RouterLink>
      <button type="button" class="nav-btn" :disabled="!records.length" @click="clearAll">全部清除</button>
    </nav>
    <p v-if="!records.length" class="empty">暂无记录</p>
    <article v-for="r in [...records].reverse()" :key="r.link + r.queryTime" class="card">
      <header class="card-title">
        <span>{{ r.name }}</span>
        <button type="button" class="linkish" @click="parseRecord(r)">解析</button>
      </header>
      <p>大小：{{ r.size }}</p>
      <p>时间：{{ r.time }}</p>
      <p>查询于：{{ r.queryTime }}</p>
      <button type="button" class="linkish danger" @click="remove(r.link)">删除</button>
    </article>
  </div>
</template>

<style scoped>
.history-page {
  padding: 12px 2.5vw 48px;
  max-width: 720px;
  margin: 0 auto;
}
.history-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.nav-btn {
  font-size: 1rem;
  padding: 8px 16px;
  border: 1px solid #999;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.empty {
  text-align: center;
  padding: 40px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 8px 12px 12px;
}
.card-title {
  display: flex;
  justify-content: space-between;
  background: rgba(219, 199, 251, 0.5);
  padding: 4px 8px;
  margin: -8px -12px 8px;
  border-radius: 8px 8px 0 0;
}
.linkish {
  border: none;
  background: none;
  color: darkorange;
  cursor: pointer;
  font-size: inherit;
}
.danger {
  color: #e83015;
}
</style>
