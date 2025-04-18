import {createApp} from "vue";
import App from "./App.vue";
import router from "./router.ts";

import {createI18n} from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';
import {createPinia} from "pinia";
import {useUserStore} from "./stores/userStore.ts";
import {useDeviceStore} from "./stores/deviceStore.ts";
import 'material-icons/iconfont/material-icons.css';

const pinia = createPinia();

const i18n = createI18n({
    locale: 'zh', // 默认语言
    fallbackLocale: 'zh', // 当找不到翻译时使用的语言
    messages: {
        en,
        zh,
    },
});

createApp(App)
    .use(router)
    .use(i18n)
    .use(pinia)
    .mount("#app");


const userStore = useUserStore();
await userStore.loadAll()

i18n.global.locale = userStore.language as typeof i18n.global.locale;

const deviceStore = useDeviceStore()
deviceStore.resetDeviceInfo()