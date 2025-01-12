<script setup lang="ts">

import {onMounted, Ref, ref} from "vue";
import {hslink_list_device, hslink_open_device, hslink_write_wait_rsp} from "../backend/hslink_backend.ts";
import {storeToRefs} from "pinia";
import {useDeviceStore} from "../stores/deviceStore.ts";

const device_list: Ref<string[]> = ref([])
const selected_device_sn: Ref<string> = ref("")

const deviceStore = useDeviceStore()
const {connected, sn, model, hw_ver, sw_ver, bl_ver} = storeToRefs(deviceStore);

async function SearchDevice() {
  device_list.value = await hslink_list_device()
}

onMounted(async () => {
  await SearchDevice()
  if (device_list.value.length > 0) {
    selected_device_sn.value = device_list.value[0]
  }
})

async function ConnectDevice() {
  console.log(`try connect to ${selected_device_sn.value}`)
  let ret = await hslink_open_device(selected_device_sn.value)
  if (ret != "success") {
    console.log(`connect to ${selected_device_sn.value} failed :${ret}`)
    return
  }
  console.log(`connect to ${selected_device_sn.value} success`)
  console.log("send hello to request info")
  let rsp = await hslink_write_wait_rsp(JSON.stringify({
    "name": "Hello"
  }), 1000)
  try {
    let rsp_json = JSON.parse(rsp)
    let serial = rsp_json["serial"]
    let model = rsp_json["model"]
    let version = rsp_json["version"]
    let bootloader = rsp_json["bootloader"]
    console.log(`serial: ${serial}, model: ${model}, version: ${version}, bootloader: ${bootloader}`)
    deviceStore.setDeviceInfo({
      sn: serial,
      model: model,
      hw_ver: "",
      sw_ver: version,
      bl_ver: bootloader
    })
  } catch (e) {
    console.log(`request info failed: ${rsp}`)
    return
  }
}

async function DisconnectDevice() {
  deviceStore.resetDeviceInfo()
}

</script>

<template>
  <div class="flex h-screen">
    <!-- 左侧部分：连接设备 -->
    <div class="w-2/5 bg-gray-100 p-6 border-r border-gray-300">
      <h2 class="text-2xl font-bold mb-4">连接设备</h2>
      <div class="mb-4">
        <span class="text-lg font-medium">选择设备:  </span>
        <select class="select select-bordered" v-model="selected_device_sn">
          <option v-for="device in device_list" :key="device" :value="device">{{ device }}</option>
        </select>
      </div>
      <div class="mb-4">
        <span class="text-lg font-medium">设备状态：</span>
        <span class="text-orange-500" v-if="connected">设备已连接</span>
        <span class="text-blue-500" v-else>设备未连接</span>
      </div>
      <div class="mb-4" v-if="connected">
        <p class="text-lg font-medium">设备型号：{{ model }}</p>
        <p class="text-lg font-medium">设备APP版本：{{ sw_ver }}</p>
        <p class="text-lg font-medium">设备BL版本：{{ sw_ver }}</p>
      </div>
      <div v-if="connected">
        <button class="btn btn-primary w-full mt-4" @click="DisconnectDevice">断开连接</button>
      </div>
      <div v-else>
        <button class="btn btn-primary w-full mt-4" @click="ConnectDevice">连接设备</button>
      </div>
    </div>

    <!-- 右侧部分：设备设置 -->
    <div class="w-3/5 p-6">
      <h2 class="text-2xl font-bold mb-4">设备设置</h2>
      <form>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">设备名称</span>
          </label>
          <input type="text" placeholder="请输入设备名称" class="input input-bordered"/>
        </div>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">工作模式</span>
          </label>
          <select class="select select-bordered">
            <option>自动</option>
            <option>手动</option>
            <option>维护</option>
          </select>
        </div>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">参数设置</span>
          </label>
          <input type="number" placeholder="请输入参数值" class="input input-bordered"/>
        </div>
        <button class="btn btn-primary w-full">保存设置</button>
      </form>
    </div>
  </div>
</template>

<style scoped>

</style>