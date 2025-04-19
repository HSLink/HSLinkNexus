<template>
  <div class="flex w-full h-screen overflow-hidden">
    <Navbar />
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  components: {
    Navbar,
  },
  setup() {
    const isNavbarCollapsed = ref(false);

    // 监听导航栏折叠状态变化
    const updateNavbarState = () => {
      isNavbarCollapsed.value = localStorage.getItem('navbarCollapsed') === 'true';
    };

    // 初始化获取导航栏状态
    onMounted(() => {
      updateNavbarState();
      // 添加storage事件监听器，当localStorage变化时更新状态
      window.addEventListener('storage', updateNavbarState);
      // 创建一个自定义事件监听器来处理同一窗口内的变化
      window.addEventListener('navbarStateChanged', updateNavbarState);
    });

    onUnmounted(() => {
      window.removeEventListener('storage', updateNavbarState);
      window.removeEventListener('navbarStateChanged', updateNavbarState);
    });

    return {
      isNavbarCollapsed
    };
  }
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
