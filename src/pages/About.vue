<script setup lang="ts">
import { onMounted, ref, Ref } from "vue";
import { version } from "../../package.json";

const ver = ref(version);
const opensource_lic = ref("MIT");

interface Developer {
  name: string;
  role: string;
  github: string;
}

const developers: Ref<Developer[]> = ref([
  {
    name: "yekai",
    role: "上位机",
    github: "https://github.com/kaidegit"
  },
  {
    name: "半糖",
    role: "调试器",
    github: "https://github.com/HalfSweet"
  }
]);
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50 p-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h2 class="text-3xl font-extrabold text-gray-900">关于</h2>
    </div>

    <!-- Content Section -->
    <div class="flex flex-col lg:flex-row bg-white shadow-md rounded-lg p-6">
      <!-- Left Column (Software Version) -->
      <div class="lg:w-1/3 space-y-4">
        <div class="space-y-2">
          <h3 class="text-xl font-semibold text-gray-800">软件版本</h3>
          <p class="text-lg text-gray-700">{{ ver }}</p>
        </div>

        <div class="space-y-2">
          <h3 class="text-xl font-semibold text-gray-800">开源协议</h3>
          <p class="text-lg text-gray-700">{{ opensource_lic }}</p>
        </div>
      </div>

      <!-- Right Column (Contributors) -->
      <div class="lg:w-2/3 space-y-4">
        <div class="space-y-2">
          <h3 class="text-xl font-semibold text-gray-800">贡献列表</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li v-for="developer in developers" :key="developer.name" class="text-lg">
              <a :href="developer.github" target="_blank" class="text-blue-500 hover:underline">{{ developer.name }}</a> - {{ developer.role }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
