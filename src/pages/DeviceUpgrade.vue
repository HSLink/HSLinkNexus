<script setup lang="ts">
import {hslink_find_bl} from "../backend/find_bl.ts";
import {hslink_write, hslink_write_wait_rsp} from "../backend/hslink_backend.ts";
import {onMounted, onUnmounted, ref} from "vue";
import {storeToRefs} from "pinia";
import {useDeviceStore} from "../stores/deviceStore.ts";
import * as dialog from '@tauri-apps/plugin-dialog';
import * as shell from '@tauri-apps/plugin-shell';
import {copy_file} from "../backend/copy_file.ts";

const deviceStore = useDeviceStore()
const {connected} = storeToRefs(deviceStore);

const fileSelectedPath = ref("");
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

async function SelectFw() {
  const file_path = await dialog.open({
    multiple: false,
    directory: false
  });
  console.log(file_path);
  if (file_path === null) {
    return;
  }
  fileSelectedPath.value = file_path;
}

async function DownloadFw() {
  await shell.open('https://github.com/cherry-embedded/CherryDAP/releases');
}

async function Upgrade() {
  if (!fileSelectedPath.value.endsWith(".uf2")) {
    console.log("file not uf2");
    return
  }
  console.log(`copy file from ${fileSelectedPath.value} to ${bootloaderPath.value}`)
  // await fs.copyFile(fileSelectedPath.value, bootloaderPath.value);
  await copy_file(fileSelectedPath.value, bootloaderPath.value + "HSLink-Pro.uf2")
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


</script>

<template>
  <div class="flex h-screen">
    <!-- 左侧部分：连接设备 -->
    <div class="w-2/5 bg-gray-100 dark:bg-gray-800 p-6 border-r border-gray-300">
      <h2 class="text-2xl font-bold mb-4">设备升级</h2>

      <div v-if="connected">
        <button class="btn btn-primary w-full mt-4" @click="EntryBL">进入Bootloader</button>
      </div>
      <div v-else-if="inBootloader">
        <div class="mb-4 flex items-center gap-4">
          <input type="text" placeholder="固件地址" class="input input-bordered" v-model="fileSelectedPath">
          <button class="btn btn-primary" @click="SelectFw">选择固件</button>
          <button class="btn btn-primary" @click="DownloadFw">下载固件</button>
        </div>
        <button class="btn btn-primary w-full mt-4" @click="Upgrade">升级APP</button>
      </div>
      <div v-else>
        <div class="text-lg font-medium mb-4">请先连接设备</div>
      </div>

    </div>

    <!-- 右侧部分：设备设置 -->
    <div class="w-3/5 p-6">
    </div>
  </div>
</template>

<style scoped>

</style>