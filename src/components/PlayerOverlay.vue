<script setup>
defineProps({
  src: { type: String, required: true },
})
defineEmits(['close'])
</script>

<template>
  <div class="player-overlay" @click.self="$emit('close')">
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
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
}
.player-sheet {
  width: 100%;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 10px 10px 0 0;
  padding-bottom: 8px;
}
.close-bar {
  width: 100%;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
}
.close-bar:hover {
  background: #ccc;
}
.player-video {
  width: 100%;
  max-height: calc(90vh - 40px);
}
</style>
