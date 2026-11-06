<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="HomeView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<script setup>
import { KeepAlive } from 'vue'
import { RouterView } from 'vue-router'
</script>
