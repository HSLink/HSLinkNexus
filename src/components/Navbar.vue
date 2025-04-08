<template>
  <nav class="bg-base-100 shadow-md p-4 fixed top-0 left-0 right-0 z-50">
    <div class="flex justify-between items-center max-w-screen-xl mx-auto">
      <!-- 左侧固定宽度区域 -->
      <div class="w-48">
        <button class="btn btn-ghost" @click="gotoDeviceSetting">
          <DeviceInfo/>
        </button>
      </div>
      
      <!-- 中间导航区域，固定宽度和位置 -->
      <div class="flex-grow flex justify-center">
        <ul class="flex space-x-4 items-center">
          <li>
            <router-link to="/device_setting" class="btn btn-ghost">{{ $t('navbar.device_setting') }}</router-link>
          </li>
          <li>
            <router-link to="/device_upgrade" class="btn btn-ghost">{{ $t('navbar.device_upgrade') }}</router-link>
          </li>
          <li>
            <router-link to="/flash" class="btn btn-ghost">{{ $t('navbar.flash') }}</router-link>
          </li>
          <li>
            <router-link to="/setting" class="btn btn-ghost">{{ $t('navbar.setting') }}</router-link>
          </li>
          <li>
            <router-link to="/about" class="btn btn-ghost">{{ $t('navbar.about') }}</router-link>
          </li>
        </ul>
      </div>
      
      <!-- 右侧固定宽度区域 -->
      <div class="w-48 flex justify-end">
        <button @click="toggleLanguage" class="btn btn-sm btn-primary">
          {{ currentLanguage }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useUserStore} from "../stores/userStore.ts";
import DeviceInfo from "./DeviceInfo.vue";
import router from "../router.ts";

const {locale, availableLocales} = useI18n();

const currentLanguage = computed(() => {
  return locale.value
})

const userStore = useUserStore();

const toggleLanguage = () => {
  for (let i = 0; i < availableLocales.length; i++) {
    if (locale.value === availableLocales[i]) {
      locale.value = availableLocales[(i + 1) % availableLocales.length];
      break;
    }
  }
  userStore.setLanguage(locale.value)
};

const gotoDeviceSetting = async () => {
  router.push("/device_setting")
}


</script>
