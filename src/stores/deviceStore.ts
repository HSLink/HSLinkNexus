import { defineStore } from 'pinia';

export interface DeviceInfo {
  sn: string;
  nickname: string;
  model: string;
  hw_ver: string;
  sw_ver: string;
  bl_ver: string;
}

interface DeviceSetting {
  speed_boost_enable: boolean;
  swd_simulate_mode: 'gpio' | 'spi';
  jtag_simulate_mode: 'gpio' | 'spi';
  jtag_20pin_compatible: boolean;
  power_output: {
    power_on: boolean;
    port_on: boolean;
    vref_voltage: number;
  };
  reset_mode: ('nrst' | 'por' | 'swd_soft')[];
  led: {
    enable: boolean;
    brightness: number;
  };
}

const DEVICE_SETTING_DEFAULT: DeviceSetting = {
  speed_boost_enable: false,
  swd_simulate_mode: 'gpio',
  jtag_simulate_mode: 'gpio',
  jtag_20pin_compatible: false,
  power_output: {
    power_on: false,
    port_on: false,
    vref_voltage: 3.3,
  },
  reset_mode: ['nrst'],
  led: {
    enable: true,
    brightness: 60,
  },
};

export const useDeviceStore = defineStore('device', {
  state: () => ({
    connected: false,

    sn: '',
    nickname: '',
    model: '',
    hw_ver: '',
    sw_ver: '',
    bl_ver: '',

    speed_boost_enable: false,
    swd_simulate_mode: 'gpio',
    jtag_simulate_mode: 'gpio',
    jtag_20pin_compatible: false,
    power_power_on: false,
    power_port_on: false,
    power_vref_voltage: 3.3,
    reset_mode: ['nrst'],
    led_enable: true,
    led_brightness: 60,
  }),
  actions: {
    setDeviceInfo(deviceInfo: DeviceInfo) {
      this.connected = true;
      this.sn = deviceInfo.sn;
      this.nickname = deviceInfo.nickname;
      this.model = deviceInfo.model;
      this.hw_ver = deviceInfo.hw_ver;
      this.sw_ver = deviceInfo.sw_ver;
      this.bl_ver = deviceInfo.bl_ver;
    },
    resetDeviceInfo() {
      this.connected = false;
      this.sn = '';
      this.nickname = '';
      this.model = '';
      this.hw_ver = '';
      this.sw_ver = '';
      this.bl_ver = '';
    },
    setDeviceSetting(deviceSetting: DeviceSetting) {
      this.speed_boost_enable = deviceSetting.speed_boost_enable;
      this.swd_simulate_mode = deviceSetting.swd_simulate_mode;
      this.jtag_simulate_mode = deviceSetting.jtag_simulate_mode;
      this.jtag_20pin_compatible = deviceSetting.jtag_20pin_compatible;
      this.power_power_on = deviceSetting.power_output.power_on;
      this.power_port_on = deviceSetting.power_output.port_on;
      this.power_vref_voltage = deviceSetting.power_output.vref_voltage;
      this.reset_mode = deviceSetting.reset_mode;
      this.led_enable = deviceSetting.led.enable;
      this.led_brightness = deviceSetting.led.brightness;
    },
    resetDeviceSetting() {
      this.speed_boost_enable = DEVICE_SETTING_DEFAULT.speed_boost_enable;
      this.swd_simulate_mode = DEVICE_SETTING_DEFAULT.swd_simulate_mode;
      this.jtag_simulate_mode = DEVICE_SETTING_DEFAULT.jtag_simulate_mode;
      this.jtag_20pin_compatible = DEVICE_SETTING_DEFAULT.jtag_20pin_compatible;
      this.power_power_on = DEVICE_SETTING_DEFAULT.power_output.power_on;
      this.power_port_on = DEVICE_SETTING_DEFAULT.power_output.port_on;
      this.power_vref_voltage = DEVICE_SETTING_DEFAULT.power_output.vref_voltage;
      this.reset_mode = DEVICE_SETTING_DEFAULT.reset_mode;
      this.led_enable = DEVICE_SETTING_DEFAULT.led.enable;
      this.led_brightness = DEVICE_SETTING_DEFAULT.led.brightness;
    },
  },
});
