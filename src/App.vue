<template>
  <div class="flex">
    <Navbar />
    <div :class="`transition-all duration-300 w-full min-h-screen bg-base-100 ${isNavbarCollapsed ? 'ml-16' : 'ml-64'}`">
      <router-view />
    </div>
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
