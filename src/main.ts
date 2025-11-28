import { createApp } from 'vue';
import App from './App.vue';
import router from './router.ts';
import { createPinia } from 'pinia';
import { useUserStore } from './stores/userStore.ts';
import { useDeviceStore } from './stores/deviceStore.ts';
import 'material-icons/iconfont/material-icons.css';
import './index.css';
import { i18n, setupI18n } from './locales';

// 创建pinia状态管理
const pinia = createPinia();

// 创建Vue应用
const app = createApp(App);

// 使用插件
app.use(router).use(i18n).use(pinia);

// 初始化应用
async function initApp() {
  // 1. 加载用户配置
  const userStore = useUserStore();
  await userStore.loadAll();

  // 2. 设置语言
  await setupI18n();

  // 3. 初始化设备状态
  const deviceStore = useDeviceStore();
  deviceStore.resetDeviceInfo();

  // 4. 挂载应用
  app.mount('#app');
}

// 启动应用
initApp().catch((error) => console.error('Failed to initialize app:', error));
