<script setup lang="ts">

import {onMounted, reactive, ref} from "vue";
import {hslink_write_wait_rsp} from "../backend/hslink_backend.ts";
import {storeToRefs} from "pinia";
import {useDeviceStore} from "../stores/deviceStore.ts";

const deviceStore = useDeviceStore()
const {connected} = storeToRefs(deviceStore);
const {sn, nickname, model, hw_ver, sw_ver, bl_ver} = storeToRefs(deviceStore)
const {
  speed_boost_enable, swd_simulate_mode, jtag_simulate_mode,
  power_power_on, power_port_on, power_vref_voltage,
  reset_mode, led_enable, led_brightness, jtag_single_bit_mode, jtag_20pin_compatible
} = storeToRefs(deviceStore)

const show_alert = ref(false)
const alert_msg = ref("")
const alert_type = ref("") // "success" 或 "error"

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
      alert_type.value = "error"
      show_alert.value = true
      setTimeout(() => {
        show_alert.value = false
      }, 3000)
      console.log(`set nickname failed: ${rsp}`)
      return
    }
  } catch (e) {
    alert_msg.value = "设置失败，请重试"
    alert_type.value = "error"
    show_alert.value = true
    setTimeout(() => {
      show_alert.value = false
    }, 3000)
    console.log(`download nickname failed: ${rsp}`)
    return
  }

  setting_str = JSON.stringify({
    name: "settings",
    data: {
      boost: speed_boost_enable.value,
      swd_port_mode: swd_simulate_mode.value,
      jtag_port_mode: jtag_simulate_mode.value,
      jtag_single_bit_mode: jtag_single_bit_mode.value,
      jtag_20pin_compatible: jtag_20pin_compatible.value,
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
      alert_msg.value = "设置成功"
      alert_type.value = "success"
      show_alert.value = true
      setTimeout(() => {
        show_alert.value = false
      }, 3000)
      console.log("set setting success")
    } else {
      alert_msg.value = "设置失败，错误原因:" + rsp_json["message"]
      alert_type.value = "error"
      show_alert.value = true
      setTimeout(() => {
        show_alert.value = false
      }, 3000)
      console.log(`set setting failed: ${rsp}`)
    }
  } catch (e) {
    alert_msg.value = "设置失败，请重试"
    alert_type.value = "error"
    show_alert.value = true
    setTimeout(() => {
      show_alert.value = false
    }, 3000)
    console.log(`download setting failed: ${rsp}`)
  }
}

</script>

<template>
  <div class="min-h-screen p-6">
    <h2 class="text-2xl font-bold mb-6">设备设置</h2>
    
    <div v-if="!connected" class="alert alert-warning shadow-lg mb-6">
      <div>
        <span class="material-icons">warning</span>
        <span>请先在主页连接设备，然后再进行设置</span>
      </div>
    </div>
    
    <div v-else class="bg-base-100 shadow-lg rounded-lg p-6">
      <form>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">设备昵称:</span>
          <input type="text" placeholder="请输入设备名称" class="input input-bordered" v-model="nickname"/>
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">启用速度Boost:</span>
          <input type="radio" name="speed_boost" class="radio-xs" v-model="speed_boost_enable"
                 :value="true"/>启用
          <input type="radio" name="speed_boost" class="radio-xs" v-model="speed_boost_enable"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">SWD输出方式:</span>
          <input type="radio" name="swd_mode" class="radio-xs" v-model="swd_simulate_mode"
                 :value="'spi'"/>SPI
          <input type="radio" name="swd_mode" class="radio-xs" v-model="swd_simulate_mode"
                 :value="'gpio'"/> GPIO
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">JTAG输出方式:</span>
          <input type="radio" name="jtag_mode" class="radio-xs" v-model="jtag_simulate_mode"
                 :value="'spi'"/>SPI
          <input type="radio" name="jtag_mode" class="radio-xs" v-model="jtag_simulate_mode"
                 :value="'gpio'"/> GPIO
        </div>
        <div class="mb-4 space-x-4" v-if="jtag_simulate_mode === 'spi'">
          <!-- 这个地方注意jtag_simulate_mode是反逻辑的，JTAG_SHIFT加速打开之后jtag_single_bit应当为false -->
          <span class="text-lg font-medium">JTAG_SHIFT 加速:</span>
          <input type="radio" name="jtag_single_bit" class="radio-xs" v-model="jtag_single_bit_mode"
                 :value="false"/>启用
          <input type="radio" name="jtag_single_bit" class="radio-xs" v-model="jtag_single_bit_mode"
                 :value="true"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">上电开启电源输出:</span>
          <input type="radio" name="power_power_on" class="radio-xs" v-model="power_power_on"
                 :value="true"/>启用
          <input type="radio" name="power_power_on" class="radio-xs" v-model="power_power_on"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">上电开启IO输出:</span>
          <input type="radio" name="power_port_on" class="radio-xs" v-model="power_port_on"
                 :value="true"/>启用
          <input type="radio" name="power_port_on" class="radio-xs" v-model="power_port_on"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">参考电压:</span>
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="1.8"/>1.8V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="3.3"/>3.3V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="3.6"/>3.6V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="5"/>5V
          <input type="radio" name="power_vref_voltage" class="radio-xs" v-model="power_vref_voltage"
                 :value="0"/>外部输入
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">默认复位方式:</span>
          <input type="checkbox" :value="'nrst'" class="checkbox-xs" v-model="reset_mode"/>NRST输出
          <input type="checkbox" :value="'por'" class="checkbox-xs" v-model="reset_mode"/>电源复位
          <input type="checkbox" :value="'arm_swd_soft'" class="checkbox-xs" v-model="reset_mode"/>Arm SWD 软复位
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">启用LED:</span>
          <input type="radio" name="led_enable" class="radio-xs" v-model="led_enable"
                 :value="true"/>启用
          <input type="radio" name="led_enable" class="radio-xs" v-model="led_enable"
                 :value="false"/> 禁用
        </div>
        <div class="mb-4 space-x-4" v-if="led_enable">
          <span class="text-lg font-medium">LED亮度:</span>
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="10"/>低亮度
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="30"/>中亮度
          <input type="radio" name="led_brightness" class="radio-xs" v-model="led_brightness"
                 :value="100"/>高亮度
        </div>
        <div class="mb-4 space-x-4">
          <span class="text-lg font-medium">20P JTAG接口兼容模式:</span>
          <input type="radio" name="jtag_20pin_compatible" class="radio-xs" v-model="jtag_20pin_compatible"
                 :value="true"/>启用
          <input type="radio" name="jtag_20pin_compatible" class="radio-xs" v-model="jtag_20pin_compatible"
                 :value="false"/> 禁用
        </div>
      </form>
      <button class="btn btn-primary w-full" @click="DownloadSetting" :disabled="!connected">保存设置</button>
    </div>
  </div>
  
  <!-- 添加提示组件 -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-x-full opacity-0"
    enter-to-class="transform translate-x-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-x-0 opacity-100"
    leave-to-class="transform translate-x-full opacity-0"
  >
    <div v-if="show_alert" 
         class="fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center text-white"
         :class="{'bg-success': alert_type === 'success', 'bg-error': alert_type === 'error'}">
      <span class="mr-2">
        <span class="material-icons" v-if="alert_type === 'success'">check_circle</span>
        <span class="material-icons" v-else>error</span>
      </span>
      <span>{{ alert_msg }}</span>
    </div>
  </transition>
</template>

<style scoped>
.transform {
  transform: translateX(0);
}

.translate-x-full {
  transform: translateX(100%);
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

.transition {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-200 {
  transition-duration: 200ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}
</style>