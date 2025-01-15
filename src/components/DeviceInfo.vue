<script setup lang="ts">

import {computed, onMounted} from "vue";

import {useDeviceStore} from "../stores/deviceStore.ts"
import {storeToRefs} from "pinia";

const deviceStore = useDeviceStore()

const {connected} = storeToRefs(deviceStore);

function TestToggleConn() {
  if (connected.value) {
    console.log("device connected")
    deviceStore.resetDeviceInfo()
    console.log(deviceStore.connected)
  } else {
    console.log("device disconnected")
    let random_sn = ""
    for (let i = 0; i < 32; i++) {
      random_sn += Math.floor(Math.random() * 10)
    }
    let random_type = ""
    for (let i = 0; i < 16; i++) {
      random_type += Math.floor(Math.random() * 10)
    }
    let random_hw_ver = ""
    for (let i = 0; i < 8; i++) {
      random_hw_ver += Math.floor(Math.random() * 10)
    }
    let random_sw_ver = ""
    for (let i = 0; i < 8; i++) {
      random_sw_ver += Math.floor(Math.random() * 10)
    }
    let random_bl_ver = ""
    for (let i = 0; i < 8; i++) {
      random_bl_ver += Math.floor(Math.random() * 10)
    }
    deviceStore.setDeviceInfo({
      sn: random_sn,
      model: "HSLink-Pro",
      nickname: "HSLink",
      hw_ver: random_hw_ver,
      sw_ver: random_sw_ver,
      bl_ver: random_bl_ver
    })
  }
}

onMounted(() => {
  TestToggleConn()
})

function test() {
  console.log("test")
  TestToggleConn()
}


</script>

<template>
  <div v-if="connected" class="grid gap-4 text-sm font-bold text-orange-500">
    {{ $t('device_info.device_connected') }}<br/>
    {{ $t('device_info.model') }}: {{ deviceStore.model }}
  </div>
  <div v-else class="text-sm font-bold text-blue-500">
    {{ $t('device_info.device_disconnected') }}
  </div>
  <!--  <button @click="test">-->
  <!--    test change conn-->
  <!--  </button>-->
</template>

<style scoped>

</style>