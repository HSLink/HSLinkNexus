import {defineStore} from 'pinia';

export interface DeviceInfo {
    sn: string;
    model: string;
    hw_ver: string;
    sw_ver: string;
    bl_ver: string;
}

export const useDeviceStore = defineStore('device', {
    state: () => ({
        connected: false,
        sn: '',
        model: '',
        hw_ver: '',
        sw_ver: '',
        bl_ver: '',
    }),
    actions: {
        setDeviceInfo(deviceInfo: DeviceInfo) {
            this.connected = true;
            this.sn = deviceInfo.sn;
            this.model = deviceInfo.model;
            this.hw_ver = deviceInfo.hw_ver;
            this.sw_ver = deviceInfo.sw_ver;
            this.bl_ver = deviceInfo.bl_ver;
        },
        resetDeviceInfo() {
            this.connected = false;
            this.sn = '';
            this.model = '';
            this.hw_ver = '';
            this.sw_ver = '';
            this.bl_ver = '';
        }
    },
});