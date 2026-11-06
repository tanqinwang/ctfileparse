<script setup>
defineProps({
  src: { type: String, required: true },
})
defineEmits(['close'])
</script>

<template>
  <div class="player-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <div class="player-sheet">
      <button type="button" class="close-bar" aria-label="关闭" @click="$emit('close')">关闭</button>
      <video controls preload="auto" :src="src" class="player-video" />
    </div>
  </div>
</template>

<style scoped>
.player-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgb(0 0 0 / 45%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  backdrop-filter: blur(2px);
}
.player-sheet {
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  background: rgb(255 255 255 / 96);
  backdrop-filter: blur(12px);
  border-radius: 14px 14px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  box-shadow: 0 -4px 24px rgb(0 0 0 / 15%);
}
.close-bar {
  width: 100%;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-muted);
}
.close-bar:hover {
  background: rgb(0 0 0 / 5%);
}
.player-video {
  width: 100%;
  max-height: calc(90vh - 48px);
  background: #000;
}
</style>
