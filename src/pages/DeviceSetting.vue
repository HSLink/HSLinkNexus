<script setup lang="ts">

import {onMounted, Reactive, reactive, Ref, ref} from "vue";
import {hslink_list_device, hslink_open_device, hslink_write_wait_rsp} from "../backend/hslink_backend.ts";
import {storeToRefs} from "pinia";
import {useDeviceStore} from "../stores/deviceStore.ts";

const device_list: Ref<string[]> = ref([])
const selected_device_sn: Ref<string> = ref("")

const deviceStore = useDeviceStore()
const {connected} = storeToRefs(deviceStore);
const {sn, nickname, model, hw_ver, sw_ver, bl_ver} = storeToRefs(deviceStore)
const {
  speed_boost_enable, swd_simulate_mode, jtag_simulate_mode,
  power_power_on, power_port_on, power_vref_voltage,
  reset_mode, led_enable, led_brightness
} = storeToRefs(deviceStore)

const show_alert = ref(false)
const alert_msg = ref("")

async function SearchDevice() {
  console.log("searching device")
  device_list.value = await hslink_list_device()
  console.log(`device list: ${device_list.value}`)
}

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
    name: "Hello"
  }), 1000)
  try {
    let rsp_json = JSON.parse(rsp)
    let serial = rsp_json["serial"]
    let model = rsp_json["model"]
    let version = rsp_json["version"]
    let bootloader = rsp_json["bootloader"]
    let nickname = rsp_json["nickname"]
    console.log(`get hslink info: serial: ${serial}, nickname ${nickname} model: ${model}`)
    console.log(`version: ${version}, bootloader: ${bootloader}`)
    deviceStore.setDeviceInfo({
      sn: serial,
      nickname,
      model,
      hw_ver: "",
      sw_ver: version,
      bl_ver: bootloader
    })
  } catch (e) {
    console.log(`request info failed: ${rsp}`)
    return
  }
  rsp = await hslink_write_wait_rsp(JSON.stringify({
    name: "get_setting"
  }), 1000)
  try {
    let rsp_json = JSON.parse(rsp)
    let speed_boost_enable = rsp_json["boost"]
    let swd_simulate_mode = rsp_json["swd_port_mode"]
    let jtag_simulate_mode = rsp_json["jtag_port_mode"]
    let power_output = rsp_json["power"]
    let power_on = power_output["power_on"]
    let port_on = power_output["port_on"]
    let vref_voltage = power_output["vref"] | power_output["voltage"]
    let reset_mode = rsp_json["reset"]
    let led = rsp_json["led"]
    let led_brightness = rsp_json["led_brightness"]
    console.log(`get device setting: ${rsp}`)
    console.log(`speed_boost_enable: ${speed_boost_enable}, swd_simulate_mode: ${swd_simulate_mode}, jtag_simulate_mode: ${jtag_simulate_mode}`)
    console.log(`power_on: ${power_on}, port_on: ${port_on}, vref: ${vref_voltage}`)
    console.log(`reset_mode: ${reset_mode}, led: ${led}, led_brightness: ${led_brightness}`)
    deviceStore.setDeviceSetting({
      speed_boost_enable,
      swd_simulate_mode,
      jtag_simulate_mode,
      power_output: {
        power_on,
        port_on,
        vref_voltage
      },
      reset_mode,
      led: {
        enable: led,
        brightness: led_brightness
      }
    })
  } catch (e) {
    console.log(`request setting failed: ${rsp}`)
    return
  }
}

async function DisconnectDevice() {
  console.log("disconnect device")
  deviceStore.resetDeviceInfo()
}

async function DownloadSetting() {
  console.log("download setting")
  let setting_str = JSON.stringify({
    name: "set_nickname",
    nickname: nickname.value
  })
  console.log(`setting str is ${setting_str}, len is ${setting_str.length}`)
  let rsp = await hslink_write_wait_rsp(setting_str, 1000)
  try {
    let rsp_json = JSON.parse(rsp)
    if (rsp_json["status"] == "success") {
      console.log("set nickname success")
    } else {
      alert_msg.value = rsp_json["message"]
      show_alert.value = true
      setTimeout(() => {
        show_alert.value = false
      })
      console.log(`set nickname failed: ${rsp}`)
    }
  } catch (e) {
    console.log(`download nickname failed: ${rsp}`)
  }

  setting_str = JSON.stringify({
    name: "settings",
    data: {
      boost: speed_boost_enable.value,
      swd_port_mode: swd_simulate_mode.value,
      jtag_port_mode: jtag_simulate_mode.value,
      power: {
        power_on: power_power_on.value,
        port_on: power_port_on.value,
        vref: power_vref_voltage.value
      },
      reset: reset_mode.value,
      led: led_enable.value,
      led_brightness: led_brightness.value
    }
  })
  console.log(`setting str is ${setting_str}, len is ${setting_str.length}`)
  rsp = await hslink_write_wait_rsp(setting_str, 1000)

  try {
    let rsp_json = JSON.parse(rsp)
    if (rsp_json["status"] == "success") {
      console.log("set setting success")
    } else {
      alert_msg.value = rsp_json["message"]
      show_alert.value = true
      setTimeout(() => {
        show_alert.value = false
      })
      console.log(`set setting failed: ${rsp}`)
    }
  } catch (e) {
    console.log(`download setting failed: ${rsp}`)
  }
}

onMounted(async () => {
  await SearchDevice()
  if (device_list.value.length > 0) {
    selected_device_sn.value = device_list.value[0]
  }
})

</script>

<template>
  <div class="flex h-screen">
    <!-- 左侧部分：连接设备 -->
    <div class="w-2/5 bg-gray-100 dark:bg-gray-800 p-6 border-r border-gray-300">
      <h2 class="text-2xl font-bold mb-4">连接设备</h2>
      <div class="mb-4 text-lg font-medium space-x-4">
        <span>选择设备:</span>
        <select class="select select-bordered" v-model="selected_device_sn" @click="SearchDevice">
          <option v-for="device in device_list" :key="device" :value="device">{{ device }}</option>
        </select>
      </div>
      <div class="mb-4 text-lg font-medium">
        <span class="">设备状态：</span>
        <span class="text-orange-500" v-if="connected">设备已连接</span>
        <span class="text-blue-500" v-else>设备未连接</span>
      </div>
      <div class="mb-4 text-lg font-medium" v-if="connected">
        <p>设备昵称：{{ nickname }}</p>
        <p>设备型号：{{ model }}</p>
        <p>设备APP版本：{{ sw_ver }}</p>
        <p>设备BL版本：{{ bl_ver }}</p>
      </div>
      <div>
        <button class="btn btn-primary w-full mt-4" v-if="connected" @click="DisconnectDevice">断开连接</button>
        <button class="btn btn-primary w-full mt-4" v-else @click="ConnectDevice">连接设备</button>
      </div>
    </div>

    <!-- 右侧部分：设备设置 -->
    <div class="w-3/5 p-6">
      <h2 class="text-2xl font-bold mb-4">设备设置</h2>
      <form>
        <div class="mb-4 space-x-4 ">
          <span class="text-lg font-medium">设备昵称:  </span>
          <input type="text" placeholder="请输入设备名称" class="input input-bordered" v-model="nickname"/>
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">启用速度Boost:</span>
<!--          <span>{{ speed_boost_enable }}</span>-->
          <input type="radio" name="speed_boost" class="radio-xs" v-model="speed_boost_enable"
                 :value="true"/>启用
          <input type="radio" name="speed_boost" class="radio-xs" v-model="speed_boost_enable"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">SWD输出方式:  </span>
<!--          <span>{{ swd_simulate_mode }}</span>-->
          <input type="radio" name="swd_mode" class="radio-xs" v-model="swd_simulate_mode"
                 :value="'spi'"/>SPI
          <input type="radio" name="swd_mode" class="radio-xs" v-model="swd_simulate_mode"
                 :value="'gpio'"/> GPIO
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">JTAG输出方式:  </span>
<!--          <span>{{ jtag_simulate_mode }}</span>-->
          <input type="radio" name="jtag_mode" class="radio-xs" v-model="jtag_simulate_mode"
                 :value="'spi'"/>SPI
          <input type="radio" name="jtag_mode" class="radio-xs" v-model="jtag_simulate_mode"
                 :value="'gpio'"/> GPIO
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">上电开启电源输出:  </span>
<!--          <span>{{ power_power_on }}</span>-->
          <input type="radio" name="power_power_on" class="radio-xs" v-model="power_power_on"
                 :value="true"/>启用
          <input type="radio" name="power_power_on" class="radio-xs" v-model="power_power_on"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">上电开启IO输出:  </span>
<!--          <span>{{ power_port_on }}</span>-->
          <input type="radio" name="power_port_on" class="radio-xs" v-model="power_port_on"
                 :value="true"/>启用
          <input type="radio" name="power_port_on" class="radio-xs" v-model="power_port_on"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">参考电压:  </span>
<!--          <span>{{ power_vref_voltage }}</span>-->
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="1.8"/>1.8V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="3.3"/>3.3V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="5"/>5V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="0"/>外部输入
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">默认复位方式:  </span>
<!--          <span>{{ reset_mode }}</span>-->
          <input type="checkbox" :value="'nrst'" class="checkbox-xs" v-model="reset_mode"/>NRST输出
          <input type="checkbox" :value="'por'" class="checkbox-xs" v-model="reset_mode"/>电源复位
          <input type="checkbox" :value="'swd_soft'" class="checkbox-xs" v-model="reset_mode"/>Arm SWD 软复位
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">启用LED:  </span>
<!--          <span>{{ led_enable }}</span>-->
          <input type="radio" name="led_enable" class="radio-xs" v-model="led_enable"
                 :value="true"/>启用
          <input type="radio" name="led_enable" class="radio-xs" v-model="led_enable"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4" v-if="led_enable">
          <span class="text-lg font-medium">LED亮度:  </span>
<!--          <span>{{ led_brightness }}</span>-->
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="10"/>低亮度
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="30"/>中亮度
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="100"/>高亮度
        </div>
      </form>
      <button class="btn btn-primary w-full" @click="DownloadSetting">保存设置</button>
    </div>
  </div>
</template>

<style scoped>

</style>