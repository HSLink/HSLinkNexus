<script setup lang="ts">
import { onMounted, ref, Ref } from "vue";
import { platform, arch, version as osVersion } from '@tauri-apps/plugin-os';
import { getVersion as version } from '@tauri-apps/api/app';

const ver = ref('');
const opensource_lic = ref("Apache-2.0");

import tauriLogo from "../assets/tech/tauri.svg";
import vueLogo from "../assets/tech/vue.svg";
import daisyuiLogo from "../assets/tech/daisyui.svg";
import tailwindLogo from "../assets/tech/tailwind.svg";

import yekaiAvatar from "../assets/contributors/yekai.png";
import halfSweetAvatar from "../assets/contributors/halfsweet.png";
import rcsnAvatar from "../assets/contributors/rcsn.png";
import sakumisuAvatar from "../assets/contributors/sakumisu.png";

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// 技术栈信息
interface Tech {
  name: string;
  description: string;
  url: string;
  logo: string;
}

const techStack: Ref<Tech[]> = ref([
  {
    name: "Tauri",
    description: "用于构建跨平台桌面应用的框架",
    url: "https://tauri.app/",
    logo: tauriLogo
  },
  {
    name: "Vue",
    description: "渐进式JavaScript前端框架",
    url: "https://vuejs.org/",
    logo: vueLogo
  },
  {
    name: "DaisyUI",
    description: "基于Tailwind CSS的组件库",
    url: "https://daisyui.com/",
    logo: daisyuiLogo
  },
  {
    name: "Tailwind CSS",
    description: "实用优先的CSS框架",
    url: "https://tailwindcss.com/",
    logo: tailwindLogo
  }
]);

interface Developer {
  name: string;
  role: string;
  github: string;
  avatar: string;
}

const developers: Ref<Developer[]> = ref([
  {
    name: "yekai",
    role: t('about.members.yekai'),
    github: "https://github.com/kaidegit",
    avatar: yekaiAvatar
  },
  {
    name: "半糖",
    role: t('about.members.halfsweet'),
    github: "https://github.com/HalfSweet",
    avatar: halfSweetAvatar
  },
  {
    name: "RCSN",
    role: t('about.members.rcsn'),
    github: "https://github.com/RCSN",
    avatar: rcsnAvatar
  },
  {
    name: "sakumisu",
    role: t('about.members.sakumisu'),
    github: "https://github.com/sakumisu",
    avatar: sakumisuAvatar
  }
]);

const animationDelays = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'];

const osVersionText = ref('');
const osType = ref('');
const osArchText = ref('');
const isCopied = ref(false);

// 获取系统信息
onMounted(async () => {
  try {
    // 使用正确的OS插件API函数
    osType.value = await platform();
    osVersionText.value = await osVersion();
    osArchText.value = await arch();
    ver.value = await version();
  } catch (error) {
    console.error("获取系统信息失败:", error);
    osType.value = "未知";
    osVersionText.value = "未知";
    osArchText.value = "未知";
  }
});

// 复制用户环境信息
const copyEnvironmentInfo = async () => {
  const environmentInfo = `
HSLink Nexus 环境信息:
${t('about.app_version')}: ${ver.value}
操作系统: ${osType.value} ${osVersionText.value} (${osArchText.value})
时间: ${new Date().toLocaleString()}
`;

  try {
    await navigator.clipboard.writeText(environmentInfo);
    isCopied.value = true;
    
    // 3秒后重置复制状态
    setTimeout(() => {
      isCopied.value = false;
    }, 3000);
  } catch (error) {
    console.error("复制环境信息失败:", error);
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-6 overflow-hidden select-none">
    <div class="container mx-auto max-w-4xl h-full overflow-y-auto scrollbar-hide pb-6">
      <!-- Header Section with Animation -->
      <div class="mb-8 animate-fade-in-down text-center">
        <div class="relative inline-block">
          <h2 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">{{ $t('about.title') }}</h2>
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
        </div>
      </div>

      <!-- Content Sections with Staggered Animation - Now in vertical layout -->
      <div class="flex flex-col gap-8">
        <!-- Software Version Card -->
        <div class="w-full transform hover:scale-105 transition-all duration-300 animate-fade-in-up delay-100">
          <div class="bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400 to-transparent opacity-20 rounded-full -mr-16 -mt-16"></div>
            
            <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
              <span class="i-tabler-info-circle mr-2 text-blue-500"></span>
              <span>{{ $t('about.version_info') }}</span>
            </h3>
            
            <div class="space-y-6 relative z-10">
              <div class="flex items-center transform hover:translate-x-2 transition-transform duration-300">
                <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                  <span class="i-tabler-version text-blue-500 dark:text-blue-300"></span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-600 dark:text-gray-300">{{ $t('about.app_version') }}</h4>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white select-text">{{ ver }}</p>
                </div>
              </div>
              
              <div class="flex items-center transform hover:translate-x-2 transition-transform duration-300">
                <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                  <span class="i-tabler-license text-purple-500 dark:text-purple-300"></span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-600 dark:text-gray-300">{{ $t('about.software_license') }}</h4>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ opensource_lic }}</p>
                </div>
              </div>
              
              <!-- 复制环境信息按钮 -->
              <div class="flex justify-center mt-4 w-full">
                <button 
                  @click="copyEnvironmentInfo" 
                  class="relative w-48 px-4 py-2 text-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  :class="{ 'bg-green-600 dark:bg-green-600 text-white': isCopied }"
                >
                  <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <span v-if="!isCopied" class="i-tabler-clipboard"></span>
                    <span v-else class="i-tabler-check"></span>
                  </div>
                  <span>{{ isCopied ? t('about.environment.success') : t('about.environment.copy') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contributors Card -->
        <div class="w-full transform hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200">
          <div class="bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div class="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-400 to-transparent opacity-20 rounded-full -ml-20 -mb-20"></div>
            
            <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
              <span class="i-tabler-users mr-2 text-purple-500"></span>
              <span>{{ $t('about.team_members') }}</span>
            </h3>
            
            <ul class="space-y-4 relative z-10">
              <li v-for="(developer, index) in developers" 
                  :key="developer.name" 
                  class="contributor-item group bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 p-3 rounded-xl"
                  :class="[animationDelays[index % animationDelays.length], 'animate-fade-in-right']">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl group-hover:ring-2 ring-blue-500">
                    <img :src="developer.avatar" :alt="`${developer.name} avatar`" class="w-full h-full object-cover group-hover:brightness-110" />
                  </div>
                  <div class="ml-4 flex-grow">
                    <a :href="developer.github" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold text-lg transition-colors duration-300">{{ developer.name }}</a>
                    <p class="text-gray-600 dark:text-gray-400">{{ developer.role }}</p>
                  </div>
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span class="i-tabler-external-link text-gray-500 dark:text-gray-400"></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Tech Stack Card -->
        <div class="w-full transform hover:scale-105 transition-all duration-300 animate-fade-in-up delay-300">
          <div class="bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div class="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-400 to-transparent opacity-20 rounded-full -mr-20 -mb-20"></div>
            
            <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
              <span class="i-tabler-stack-2 mr-2 text-pink-500"></span>
              <span>{{ $t('about.technology_stack') }}</span>
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              <div v-for="(tech, index) in techStack" 
                  :key="tech.name" 
                  class="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-500 hover:border-blue-300 dark:hover:border-blue-700"
                  :class="[animationDelays[index % animationDelays.length], 'animate-fade-in-up']">
                <div class="flex flex-col justify-between h-full">
                  <div class="flex flex-col">
                    <div class="flex items-center justify-center mb-4">
                      <div class="w-16 h-16 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full transform group-hover:rotate-12 transition-transform duration-500 shadow-lg p-2 border border-gray-200 dark:border-gray-600">
                        <img :src="tech.logo" :alt="`${tech.name} logo`" class="w-full h-full object-contain" />
                      </div>
                    </div>
                    <h4 class="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 mb-2">{{ tech.name }}</h4>
                    <p class="text-gray-600 dark:text-gray-400 text-center mb-4">{{ tech.description }}</p>
                  </div>
                  <div class="text-center">
                    <a :href="tech.url" target="_blank" class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                      访问官网
                      <span class="i-tabler-external-link ml-2"></span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm animate-fade-in-up delay-500">
        <div class="mb-2">
          <span class="i-tabler-copyright mr-1"></span>
          <span>{{ new Date().getFullYear() }} HSLink Team. 保留所有权利。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-down {
  animation: fadeInDown 0.8s ease-out forwards;
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-fade-in-right {
  opacity: 0;
  animation: fadeInRight 0.8s ease-out forwards;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.delay-0 { animation-delay: 0ms; }
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }

.contributor-item {
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: center;
}

.contributor-item:hover {
  transform: scale(1.08) translateX(8px);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

/* 隐藏滚动条但保留滚动功能 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
