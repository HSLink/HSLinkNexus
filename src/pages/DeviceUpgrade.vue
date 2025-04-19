<script setup lang="ts">
import {hslink_find_bl} from "../backend/find_bl.ts";
import {hslink_write, hslink_write_wait_rsp} from "../backend/hslink_backend.ts";
import {computed, onMounted, onUnmounted, ref} from "vue";
import {storeToRefs} from "pinia";
import {useDeviceStore} from "../stores/deviceStore.ts";
import * as dialog from '@tauri-apps/plugin-dialog';
import * as shell from '@tauri-apps/plugin-shell';
import * as fs from '@tauri-apps/plugin-fs'
import {copy_file} from "../backend/copy_file.ts";
import {Base64} from 'js-base64';
import {CRC32} from "../utils/crc32.ts";

const deviceStore = useDeviceStore()
const {connected} = storeToRefs(deviceStore);

const {sw_ver, bl_ver} = storeToRefs(deviceStore)

const AppFwPath = ref("");
const BootloaderFwPath = ref("");
const bootloaderPath = ref("");

async function find_bl() {
  let res = await hslink_find_bl();
  console.log(res);
}

async function EntryBL() {
  await hslink_write(JSON.stringify({
    name: "entry_hslink_bl"
  }));
}

async function SelectAppFw() {
  const file_path = await dialog.open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'App',
        extensions: ['uf2']
      }
    ]
  });
  console.log(file_path);
  if (file_path === null) {
    return;
  }
  AppFwPath.value = file_path;
}

async function SelectBootloaderFw() {
  const file_path = await dialog.open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Bootloader',
        extensions: ['bin']
      }
    ]
  });
  console.log(file_path);
  if (file_path === null) {
    return;
  }
  BootloaderFwPath.value = file_path;
}

async function DownloadFw() {
  await shell.open('https://github.com/cherry-embedded/CherryDAP/releases');
}

async function UpgradeApp() {
  if (!AppFwPath.value.endsWith(".uf2")) {
    console.log("file not uf2");
    return
  }
  console.log(`copy file from ${AppFwPath.value} to ${bootloaderPath.value}`)
  // await fs.copyFile(fileSelectedPath.value, bootloaderPath.value);
  await copy_file(AppFwPath.value, bootloaderPath.value + "HSLink-Pro.uf2")
}

async function UpgradeBootloader() {
  {
    let msg = {
      name: "erase_bl_b"
    }
    console.log(msg)
    let res = await hslink_write_wait_rsp(JSON.stringify(msg), 1000)
    console.log(`erase_bl_b: ${res}`)
  }

  let file = await fs.readFile(BootloaderFwPath.value)

  // 四字节对齐
  if (file.length % 4 != 0) {
    let new_file = new Uint8Array(file.length + (4 - file.length % 4))
    new_file.set(file)
    file = new_file
  }

  let file_length = file.length
  let crc32_calc = CRC32(file, file_length)
  console.log("crc32 calc", crc32_calc)

  // 以512字节转为bin数组
  let file_array: Array<Uint8Array> = []
  while (file.length > 0) {
    file_array.push(file.slice(0, 512))
    file = file.slice(512)
  }
  // console.log("file array")
  // console.log(file_array[0])
  // console.log(file_array[file_array.length - 1])

  for (let i = 0; i < file_array.length; i++) {
    let msg = {
      name: "write_bl_b",
      addr: 512 * i,
      len: file_array[i].length,
      data: Base64.fromUint8Array(file_array[i])
    }
    console.log(msg)
    let res = await hslink_write_wait_rsp(JSON.stringify(msg), 1000)
    console.log(`write_bl_b: ${res}`)
  }

  {
    let msg = {
      name: "upgrade_bl",
      len: file_length,
      crc: "0x" + crc32_calc.toString(16),
    }
    console.log(msg)
    let res = await hslink_write_wait_rsp(JSON.stringify(msg), 1000)
    console.log(`upgrade_bl: ${res}`)
  }

}

let inBootloader = ref(false);
let probe_tmr: ReturnType<typeof setInterval>;

async function probe_bl() {
  let res = await hslink_find_bl();
  // console.log("connect", connected.value)
  // console.log("hslink_find_bl", res)
  if (res.indexOf("HSLinkError") == -1) {
    console.log("find bl success")
    inBootloader.value = true;
    bootloaderPath.value = res;
  } else {
    inBootloader.value = false
    // console.log("find bl failed")
  }
}

onMounted(() => {
  probe_tmr = setInterval(probe_bl, 1000)
  probe_bl();
})

onUnmounted(() => {
  clearInterval(probe_tmr);
})

// 检查App版本是否满足升级Bootloader的最低要求(2.4.0)
const isAppVersionSupported = computed(() => {
  if (!sw_ver.value) return false;
  
  const versionParts = sw_ver.value.split('.').map(Number);
  const minVersion = [2, 4, 0];
  
  for (let i = 0; i < 3; i++) {
    const current = versionParts[i] || 0;
    if (current > minVersion[i]) return true;
    if (current < minVersion[i]) return false;
  }
  
  return true;
});

</script>

<template>
  <div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 p-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h2 class="text-3xl font-extrabold">{{ $t('device_upgrade.title') }}</h2>
    </div>

    <!-- 未连接设备时的提示 -->
    <div v-if="!connected" class="flex items-center justify-center h-[70vh]">
      <div class="bg-base-200 bg-opacity-80 rounded-xl p-10 shadow-lg text-center max-w-lg">
        <span class="material-icons text-8xl text-primary mb-4">link_off</span>
        <h2 class="text-2xl font-semibold mb-2">{{ $t('device_upgrade.not_connected') }}</h2>
        <p class="text-lg mb-6 text-base-content opacity-80">{{ $t('device_upgrade.connect_prompt') }}</p>
        <router-link to="/" class="btn btn-primary">
          <span class="material-icons mr-2">home</span>
          {{ $t('device_upgrade.back_to_home') }}
        </router-link>
      </div>
    </div>

    <!-- 已连接设备时显示升级选项 -->
    <template v-else>
      <!-- Content Section -->
      <div class="flex flex-col lg:flex-row bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-4">
        <!-- Left Column -->
        <div class="lg:w-1/3 space-y-4">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold ">{{ $t('device_upgrade.bootloader.title') }}</h3>
          </div>
          <div class="space-y-2">
            <p class="text-lg ">{{ $t('device_upgrade.bootloader.current_version') }}: {{ bl_ver }}</p>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:w-2/3 space-y-4">
          <div class="space-y-2">
            <div v-if="connected">
              <input type="text" :placeholder="$t('device_upgrade.bootloader.firmware_path')" class="input input-bordered w-2/3" v-model="BootloaderFwPath">
              <button class="btn btn-primary w-1/3" @click="SelectBootloaderFw">{{ $t('device_upgrade.bootloader.select_firmware') }}</button>
              <button class="btn btn-primary w-full mt-4" :disabled="!isAppVersionSupported" @click="UpgradeBootloader">{{ $t('device_upgrade.bootloader.upgrade') }}</button>
              <div v-if="!isAppVersionSupported" class="text-red-500 mt-2">
                {{ $t('device_upgrade.bootloader.version_required') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="flex flex-col lg:flex-row bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-4">
        <!-- Left Column -->
        <div class="lg:w-1/3 space-y-4">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold ">{{ $t('device_upgrade.app.title') }}</h3>
          </div>
          <div class="space-y-2">
            <p class="text-lg ">{{ $t('device_upgrade.app.current_version') }} {{ sw_ver }}</p>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:w-2/3 space-y-4">
          <div class="space-y-2">
            <div v-if="connected">
              <button class="btn btn-primary w-full mt-4" @click="EntryBL">{{ $t('device_upgrade.app.enter_bootloader') }}</button>
            </div>
            <div v-else-if="inBootloader">
              <div class="mb-4 flex items-center gap-4">
                <input type="text" :placeholder="$t('device_upgrade.app.firmware_path')" class="input input-bordered w-2/3" v-model="AppFwPath">
                <button class="btn btn-primary w-1/3" @click="SelectAppFw">{{ $t('device_upgrade.app.select_firmware') }}</button>
              </div>
              <button class="btn btn-primary w-full mt-4" @click="UpgradeApp">{{ $t('device_upgrade.app.upgrade') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="flex flex-col lg:flex-row bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-4">
        <!-- Left Column -->
        <div class="lg:w-1/3 space-y-4">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold ">{{ $t('device_upgrade.download.title') }}</h3>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:w-2/3 space-y-4">
          <div class="space-y-2">
            <button class="btn btn-primary w-full mt-4" @click="DownloadFw">{{ $t('device_upgrade.download.download_button') }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>

</style>