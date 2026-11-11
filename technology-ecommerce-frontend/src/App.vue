<script setup>
import AppHeader from '@/components/AppHeader.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const hideHeader = computed(() =>
  ['/login', '/register'].includes(route.path) ||
  route.path.startsWith('/admin')
)</script>

<template>
  <AppHeader v-if="!hideHeader" />
  <RouterView />
</template>