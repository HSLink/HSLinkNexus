<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from "vue";
import { hslink_list_device, hslink_open_device, hslink_write_wait_rsp } from "../backend/hslink_backend.ts";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "../stores/deviceStore.ts";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 设备信息数据结构
interface DeviceInfo {
  sn: string;
  nickname?: string;
  model?: string;
  hw_ver?: string;
  sw_ver?: string;
  bl_ver?: string;
  connected: boolean;
  infoLoaded: boolean; // 标记是否已加载信息
}

const device_list = ref<string[]>([]);
const selected_device_sn = ref("");

// 当前发现的设备列表
const availableDevices = ref<DeviceInfo[]>([]);
// 使用定时器定期检查设备变化
const deviceScanInterval = ref<number | null>(null);

const deviceStore = useDeviceStore();
const { connected } = storeToRefs(deviceStore);
const { sn, nickname, model, hw_ver, sw_ver, bl_ver } = storeToRefs(deviceStore);

const show_alert = ref(false);
const alert_msg = ref("");
const alert_type = ref(""); // "success" 或 "error"

// 当前连接设备的序列号
const connectedDeviceSn = ref("");

// 设备扫描函数，包含设备信息获取
async function SearchDevice() {
  console.log("searching device");
  const newDeviceList = await hslink_list_device();
  console.log(`device list: ${newDeviceList}`);
  
  // 检查设备是否有变化
  const oldDeviceSns = availableDevices.value.map(device => device.sn);
  const newDeviceSns = newDeviceList;
  
  // 检查设备是否已移除
  const removedDevices = oldDeviceSns.filter(sn => !newDeviceSns.includes(sn));
  if (removedDevices.length > 0) {
    console.log(`Devices removed: ${removedDevices.join(', ')}`);
    
    // 移除已拔出的设备
    availableDevices.value = availableDevices.value.filter(device => !removedDevices.includes(device.sn));
    
    // 如果当前连接的设备被移除，断开连接
    if (connectedDeviceSn.value && removedDevices.includes(connectedDeviceSn.value)) {
      console.log(`Connected device ${connectedDeviceSn.value} was removed`);
      DisconnectDevice();
      showAlert(t('home.alert.disconnect'), "warning");
    }
  }
  
  // 检查是否有新设备
  const newDevices = newDeviceSns.filter(sn => !oldDeviceSns.includes(sn));
  for (const newDeviceSn of newDevices) {
    console.log(`New device found: ${newDeviceSn}`);
    
    // 将新设备添加到列表中
    availableDevices.value.push({
      sn: newDeviceSn,
      connected: false,
      infoLoaded: false
    });
    
    // 获取新设备的基本信息
    getDeviceBasicInfo(newDeviceSn);
  }
  
  // 更新设备列表
  device_list.value = newDeviceList;
  if (device_list.value.length > 0 && !selected_device_sn.value) {
    selected_device_sn.value = device_list.value[0];
  }
}

// 获取设备基本信息但不连接
async function getDeviceBasicInfo(deviceSn: string) {
  try {
    // 临时连接设备获取信息
    console.log(`Getting info for device: ${deviceSn}`);
    const ret = await hslink_open_device(deviceSn);
    if (ret !== "success") {
      console.log(`Failed to open device ${deviceSn} for info: ${ret}`);
      return;
    }
    
    // 设备已连接，获取基本信息
    const rsp = await hslink_write_wait_rsp(JSON.stringify({
      name: "Hello"
    }), 1000);
    
    try {
      const rsp_json = JSON.parse(rsp);
      const serial = rsp_json["serial"];
      const model = rsp_json["model"];
      const version = rsp_json["version"];
      const hardware = rsp_json["hardware"];
      const bootloader = rsp_json["bootloader"];
      const nickname = rsp_json["nickname"] || "";
      
      console.log(`Got info for ${deviceSn}: model=${model}, nickname='${nickname}'`);
      console.log(`Raw device info response: ${JSON.stringify(rsp_json)}`);
      
      // 确保昵称不是undefined或null
      const safeNickname = (nickname === undefined || nickname === null) ? "" : nickname;
      
      // 更新设备信息
      const deviceIndex = availableDevices.value.findIndex(d => d.sn === deviceSn);
      if (deviceIndex >= 0) {
        availableDevices.value[deviceIndex] = {
          ...availableDevices.value[deviceIndex],
          nickname: safeNickname,
          model,
          hw_ver: hardware,
          sw_ver: version,
          bl_ver: bootloader,
          infoLoaded: true
        };
        
        console.log(`Updated device info: ${JSON.stringify(availableDevices.value[deviceIndex])}`);
      }
      
      // 如果这不是当前连接的设备，断开临时连接
      if (deviceSn !== connectedDeviceSn.value) {
        // 显式断开临时连接
        console.log(`Explicitly closing temporary connection to ${deviceSn}`);
        
        // 发送关闭命令
        await hslink_write_wait_rsp(JSON.stringify({
          name: "Close"
        }), 500).catch(e => {
          console.log(`Error sending Close command: ${e}`);
        });
        
        // 不需要调用DisconnectDevice，那会影响UI状态
      } else {
        console.log(`Device ${deviceSn} is already connected, keeping connection`);
      }
    } catch (e) {
      console.log(`Failed to parse info response for ${deviceSn}: ${rsp}`);
    }
  } catch (e) {
    console.log(`Error getting info for device ${deviceSn}: ${e}`);
  }
}

// 完全连接设备（用于用户主动连接）
async function ConnectDevice(deviceSn = "") {
  // 如果已经有设备连接，先断开它
  if (connected.value || connectedDeviceSn.value) {
    await DisconnectDevice();
  }
  
  const sn = deviceSn || selected_device_sn.value;
  
  console.log(`Connecting to device: ${sn}`);
  let ret = await hslink_open_device(sn);
  if (ret != "success") {
    console.log(`connect to ${sn} failed: ${ret}`);
    showAlert(t('home.alert.connect_fail') + `: ${ret}`, "error");
    return;
  }
  
  connectedDeviceSn.value = sn;
  
  // 更新设备连接状态
  updateDeviceConnectionState();
  
  console.log(`connect to ${sn} success`);
  console.log("send hello to request info");
  let rsp = await hslink_write_wait_rsp(JSON.stringify({
    name: "Hello"
  }), 1000);
  
  try {
    let rsp_json = JSON.parse(rsp);
    let serial = rsp_json["serial"];
    let model = rsp_json["model"];
    let version = rsp_json["version"];
    let hardware = rsp_json["hardware"];
    let bootloader = rsp_json["bootloader"];
    let nickname = rsp_json["nickname"];
    console.log(`get hslink info: serial: ${serial}, nickname ${nickname} model: ${model}`);
    console.log(`hw:${hardware} app: ${version}, bootloader: ${bootloader}`);
    
    // 更新全局状态
    deviceStore.setDeviceInfo({
      sn: serial,
      nickname,
      model,
      hw_ver: hardware,
      sw_ver: version,
      bl_ver: bootloader
    });
    
    // 同时更新设备列表中的信息
    const deviceIndex = availableDevices.value.findIndex(d => d.sn === sn);
    if (deviceIndex >= 0) {
      availableDevices.value[deviceIndex] = {
        ...availableDevices.value[deviceIndex],
        nickname,
        model,
        hw_ver: hardware,
        sw_ver: version,
        bl_ver: bootloader,
        connected: true,
        infoLoaded: true
      };
    }
    
    showAlert(t('home.alert.connect_success'), "success");
  } catch (e) {
    console.log(`request info failed: ${rsp}`);
    showAlert(t('home.alert.info_fail'), "error");
    connectedDeviceSn.value = "";
    return;
  }
  
  rsp = await hslink_write_wait_rsp(JSON.stringify({
    name: "get_setting"
  }), 1000);
  
  try {
    let rsp_json = JSON.parse(rsp);
    let speed_boost_enable = rsp_json["boost"];
    let swd_simulate_mode = rsp_json["swd_port_mode"];
    let jtag_simulate_mode = rsp_json["jtag_port_mode"];
    let power_output = rsp_json["power"];
    let power_on = power_output["power_on"];
    let port_on = power_output["port_on"];
    let vref_voltage = power_output["vref"];
    let reset_mode = rsp_json["reset"];
    let led = rsp_json["led"];
    let led_brightness = rsp_json["led_brightness"];
    let jtag_20pin_compatible = rsp_json["jtag_20pin_compatible"] ?? false;
    console.log(`get device setting: ${rsp}`);
    deviceStore.setDeviceSetting({
      speed_boost_enable,
      swd_simulate_mode,
      jtag_simulate_mode,
      jtag_20pin_compatible,
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
    });
  } catch (e) {
    console.log(`request setting failed: ${rsp}`);
  }
}

function setDeviceImage(model?: string) {
  if (model?.toLowerCase().includes("pro")) {
    return "/series/HSLink-Pro.png";
  } else if (model?.toLowerCase().includes("mini")) {
    return "/series/HSLink-mini.png";
  } else if (model?.toLowerCase().includes("ultra")) {
    return "/series/HSLink-Ultra.png";
  } else {
    return "/HSLink.svg"; // 默认图片
  }
}

async function DisconnectDevice() {
  console.log("disconnect device");
  
  // 更新设备连接状态
  const deviceIndex = availableDevices.value.findIndex(d => d.sn === connectedDeviceSn.value);
  if (deviceIndex >= 0) {
    availableDevices.value[deviceIndex].connected = false;
  }
  
  connectedDeviceSn.value = "";
  deviceStore.resetDeviceInfo();
  
  showAlert(t('home.alert.disconnect'), "success");
}

// 获取设备显示名称
function getDeviceDisplayName(device: DeviceInfo): string {
  if (device.nickname && device.nickname.trim() !== '') {
    return device.nickname;
  }
  
  // 如果没有昵称，显示序列号的前6位
  return device.sn.substring(0, 6);
}

function showAlert(message: string, type: string) {
  alert_msg.value = message;
  alert_type.value = type;
  show_alert.value = true;
  setTimeout(() => {
    show_alert.value = false;
  }, 3000);
}

// 更新设备连接状态
function updateDeviceConnectionState() {
  availableDevices.value = availableDevices.value.map(device => ({
    ...device,
    connected: device.sn === connectedDeviceSn.value
  }));
}

// 同步连接状态
function syncConnectedState() {
  if (connected.value && sn.value) {
    // 如果store中显示设备已连接，但connectedDeviceSn为空，则进行同步
    connectedDeviceSn.value = sn.value;
    updateDeviceConnectionState();
  } else if (!connected.value) {
    // 如果store中显示设备未连接，但connectedDeviceSn不为空，则清空
    connectedDeviceSn.value = "";
    updateDeviceConnectionState();
  }
}

// 开始定期扫描设备
function startDeviceScanning() {
  // 每3秒扫描一次设备
  deviceScanInterval.value = setInterval(SearchDevice, 3000) as unknown as number;
}

// 停止扫描
function stopDeviceScanning() {
  if (deviceScanInterval.value !== null) {
    clearInterval(deviceScanInterval.value);
    deviceScanInterval.value = null;
  }
}

onMounted(async () => {
  await SearchDevice();
  if (device_list.value.length > 0) {
    selected_device_sn.value = device_list.value[0];
  }
  
  // 在组件挂载时同步连接状态
  syncConnectedState();
  
  // 启动定期扫描
  startDeviceScanning();
});

onUnmounted(() => {
  // 组件卸载时停止扫描
  stopDeviceScanning();
});

// 监听连接状态变化
watch(connected, () => {
  syncConnectedState();
});

// 监听序列号变化
watch(sn, () => {
  if (connected.value && sn.value) {
    connectedDeviceSn.value = sn.value;
    updateDeviceConnectionState();
  }
});
</script>

<template>
  <div class="min-h-screen p-6">
    <!-- 无设备时的居中提示 -->
    <div v-if="availableDevices.length === 0" class="flex items-center justify-center h-[80vh]">
      <div class="bg-base-200 bg-opacity-80 rounded-xl p-10 shadow-lg text-center max-w-lg">
        <span class="material-icons text-8xl text-primary mb-4">sensors_off</span>
        <h2 class="text-2xl font-semibold mb-2">{{ t('home.no_device') }}</h2>
        <p class="text-lg mb-6 text-base-content opacity-80">{{ t('home.connect_prompt') }}</p>
        <button @click="SearchDevice" class="btn btn-primary">
          <span class="material-icons mr-2">refresh</span>
          {{ t('home.refresh') }}
        </button>
      </div>
    </div>

    <!-- 设备列表标题 -->
    <div v-if="availableDevices.length > 0" class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">{{ t('home.my_devices') }}</h2>
      <div class="flex items-center space-x-2">
        <button @click="SearchDevice" class="btn btn-primary">
          <span class="material-icons mr-2">refresh</span>
          {{ t('home.refresh') }}
        </button>
      </div>
    </div>

    <!-- 设备卡片布局 -->
    <div v-if="availableDevices.length > 0" class="flex flex-wrap justify-center -mx-3">
      <!-- 设备卡片 -->
      <div v-for="device in availableDevices" :key="device.sn" 
           class="px-3 w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-2/5 mb-6">
        <div class="h-full flex flex-col bg-base-100 rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform"
             :class="{'ring-2 ring-primary': device.sn === connectedDeviceSn}">
          <!-- 卡片头部：设备名称和连接状态 -->
          <div class="px-6 py-5 bg-base-200 flex items-center justify-between">
            <h3 class="text-xl font-bold truncate">{{ device.nickname || device.sn.substring(0, 6) }}</h3>
            <span v-if="device.sn === connectedDeviceSn" class="badge badge-success">{{ t('home.connected') }}</span>
            <span v-else class="badge badge-outline">{{ t('home.disconnected') }}</span>
          </div>
          
          <!-- 设备信息部分 -->
          <div class="p-6 flex-grow flex flex-col">
            <!-- 未加载信息时显示加载中 -->
            <div v-if="!device.infoLoaded" class="flex-grow flex flex-col items-center justify-center">
              <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
              <p class="text-center text-base-content opacity-70">
                {{ t('home.loading') }}
              </p>
            </div>
            
            <!-- 已加载信息但未连接的状态 -->
            <div v-else-if="device.sn !== connectedDeviceSn && device.infoLoaded" class="flex-grow flex flex-col">
              <div class="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                <div>
                  <p class="text-sm opacity-70">{{ t('home.hardware_version') }}</p>
                  <p class="font-medium text-primary">{{ device.hw_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.software_version') }}</p>
                  <p class="font-medium text-primary">{{ device.sw_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.bootloader_version') }}</p>
                  <p class="font-medium text-primary">{{ device.bl_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.device_model') }}</p>
                  <p class="font-medium text-primary">{{ device.model || t('home.unknown') }}</p>
                </div>
              </div>
              
              <!-- 设备昵称和序列号 (可复制) -->
              <div class="mb-4 allow-select">
                <div class="mb-2">
                  <p class="text-sm opacity-70">{{ t('home.device_nickname') }}</p>
                  <p class="font-medium text-primary break-words">{{ device.nickname || t('home.unnamed') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('device_info.sn') }}</p>
                  <p class="font-medium text-primary break-words">{{ device.sn }}</p>
                </div>
              </div>
              
              <!-- 设备图片 -->
              <div class="flex justify-center mt-2 flex-grow">
                <img :src="setDeviceImage(device.model)" :alt="device.model" class="max-h-36 object-contain" />
              </div>
            </div>
            
            <!-- 已连接状态 -->
            <div v-else-if="device.sn === connectedDeviceSn" class="flex-grow flex flex-col">
              <div class="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                <div>
                  <p class="text-sm opacity-70">{{ t('home.hardware_version') }}</p>
                  <p class="font-medium text-primary">{{ device.hw_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.software_version') }}</p>
                  <p class="font-medium text-primary">{{ device.sw_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.bootloader_version') }}</p>
                  <p class="font-medium text-primary">{{ device.bl_ver || t('home.unknown') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('home.device_model') }}</p>
                  <p class="font-medium text-primary">{{ device.model || t('home.unknown') }}</p>
                </div>
              </div>
              
              <!-- 设备昵称和序列号 (可复制) -->
              <div class="mb-4 allow-select">
                <div class="mb-2">
                  <p class="text-sm opacity-70">{{ t('home.device_nickname') }}</p>
                  <p class="font-medium text-primary break-words">{{ device.nickname || t('home.unnamed') }}</p>
                </div>
                <div>
                  <p class="text-sm opacity-70">{{ t('device_info.sn') }}</p>
                  <p class="font-medium text-primary break-words">{{ device.sn }}</p>
                </div>
              </div>
              
              <!-- 设备图片 -->
              <div class="flex justify-center mt-2 flex-grow">
                <img :src="setDeviceImage(device.model)" :alt="device.model" class="max-h-36 object-contain" />
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex flex-wrap justify-center gap-2 mt-4">
              <button v-if="device.sn === connectedDeviceSn" 
                      class="btn btn-sm btn-outline min-w-[80px]" 
                      @click="DisconnectDevice">{{ t('home.disconnect') }}</button>
              <button v-else 
                      class="btn btn-sm btn-primary min-w-[80px]" 
                      @click="ConnectDevice(device.sn)">{{ t('home.connect') }}</button>
                      
              <router-link v-if="device.sn === connectedDeviceSn" 
                          to="/device_setting" 
                          class="btn btn-sm btn-primary min-w-[80px]">
                <span class="material-icons mr-1 text-sm">settings</span>
                {{ t('home.settings') }}
              </router-link>
              <button v-else class="btn btn-sm btn-disabled min-w-[80px]" disabled>
                <span class="material-icons mr-1 text-sm">settings</span>
                {{ t('home.settings') }}
              </button>
              
              <router-link v-if="device.sn === connectedDeviceSn" 
                          to="/device_upgrade" 
                          class="btn btn-sm btn-secondary min-w-[80px]">
                <span class="material-icons mr-1 text-sm">update</span>
                {{ t('home.upgrade') }}
              </router-link>
              <button v-else class="btn btn-sm btn-disabled min-w-[80px]" disabled>
                <span class="material-icons mr-1 text-sm">update</span>
                {{ t('home.upgrade') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 提示框 -->
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
         :class="{'bg-success': alert_type === 'success', 'bg-error': alert_type === 'error', 'bg-warning': alert_type === 'warning'}">
      <span class="mr-2">
        <span class="material-icons" v-if="alert_type === 'success'">check_circle</span>
        <span class="material-icons" v-else-if="alert_type === 'warning'">warning</span>
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

/* 禁止设备卡片中的文本选择，但允许特定区域可选择 */
.bg-base-100 {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 允许设备昵称和序列号区域可选择 */
.allow-select {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

/* 禁止设备卡片中的图片被拖拽和选择 */
.bg-base-100 img {
  pointer-events: none; /* 防止鼠标交互 */
  -webkit-user-drag: none; /* 防止拖拽 */
  user-select: none; /* 防止选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>