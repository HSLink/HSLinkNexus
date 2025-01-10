<template>
  <nav class="bg-base-100 shadow-md p-4">
    <div class="flex justify-between items-center">
      <a href="/device_setting" class="text-xl font-bold">{{ $t('device_info.sn') }}</a>
      <ul class="flex space-x-4">
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
      <button @click="toggleLanguage" class="btn btn-sm btn-primary">{{ currentLanguage }}</button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useUserStore} from "../stores/userStore.ts";

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


</script>
