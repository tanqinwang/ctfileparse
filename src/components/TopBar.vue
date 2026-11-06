<script setup>
defineProps({
  message: { type: String, default: '城通网盘 · 直连解析' },
  icon: { type: String, default: '' },
  bgColor: { type: String, default: '#fff8f0' },
})
</script>

<template>
  <header class="top-bar" :style="{ backgroundColor: bgColor }">
    <div class="top-bar-center">
      <img v-if="icon" class="msg-icon" :src="icon" alt="" />
      <p class="msg-text">{{ message }}</p>
    </div>
    <div class="act-zone">
      <slot name="actions" />
    </div>
  </header>
</template>
