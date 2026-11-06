<script setup>
defineProps({
  message: { type: String, default: '城通网盘解析器～(∠・ω< )⌒☆' },
  icon: { type: String, default: '/icon.webp' },
  bgColor: { type: String, default: '#ffffff' },
})
</script>

<template>
  <header class="top-bar" :style="{ backgroundColor: bgColor }">
    <div class="msg-zone">
      <p class="msg-icon" :style="{ backgroundImage: icon ? `url(${icon})` : 'none' }" />
      <p class="msg-text">{{ message }}</p>
    </div>
    <div class="act-zone">
      <slot name="actions" />
    </div>
  </header>
</template>
