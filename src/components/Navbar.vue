<template>
  <nav class="bg-base-100 shadow-md p-4">
    <div class="flex items-center">
      <button class="btn btn-ghost" @click="gotoDeviceSetting">
        <DeviceInfo/>
      </button>
      <ul class="flex space-x-4 items-center mx-auto">
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
      <button @click="toggleLanguage" class="btn btn-sm btn-primary">
        {{ currentLanguage }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useUserStore} from "../stores/userStore.ts";
import DeviceInfo from "./DeviceInfo.vue";
import router from "../router.ts";
import {
  hslink_list_device,
  hslink_open_device,
  hslink_write,
  hslink_write_wait_rsp
} from "../backend/hslink_backend.ts";

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
  let devices = await hslink_list_device()
  if (devices.length === 1) {
    let device_sn = devices[0]
    console.log("device_sn:", device_sn)
    let res = await hslink_open_device(device_sn)
    if (res == "success") {
      console.log("open device success")
      let rsp = await hslink_write_wait_rsp(JSON.stringify({
        "name": "Hello"
      }), 1000)
      console.log("rsp:", rsp)
    } else {
      console.log("open device failed")
    }
  }
  router.push("/device_setting")
}


</script>
