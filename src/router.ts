import {createRouter, createWebHistory} from 'vue-router';
import About from './pages/About.vue';
import DeviceSetting from "./pages/DeviceSetting.vue";
import DeviceUpgrade from "./pages/DeviceUpgrade.vue";
import Flash from "./pages/Flash.vue";
import Setting from "./pages/Setting.vue";

const routes = [
    {path: '/', redirect: '/device_setting'},
    {path: '/device_setting', name: 'DeviceSetting', component: DeviceSetting},
    {path: '/device_upgrade', name: 'DeviceUpgrade', component: DeviceUpgrade},
    {path: '/flash', name: 'Flash', component: Flash},
    {path: '/setting', name: 'Setting', component: Setting},
    {path: '/about', name: 'About', component: About},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
