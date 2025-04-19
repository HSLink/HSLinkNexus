<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useUserStore, ThemeType } from '../stores/userStore';
import { useI18n } from 'vue-i18n';
import { availableLanguages, Language, getLanguageByCode } from '../locales';

// 获取用户存储和国际化
const userStore = useUserStore();
const { t, locale } = useI18n();

// 设置的实时状态
const activeTheme = ref<ThemeType>(userStore.theme as ThemeType);
const activeLanguage = ref<string>(userStore.language);

// 当前语言对象
const currentLanguage = computed<Language>(() => {
  return getLanguageByCode(activeLanguage.value);
});

// 下拉菜单显示状态
const isLanguageDropdownOpen = ref(false);

// 语言搜索功能
const searchQuery = ref('');
const filteredLanguages = computed(() => {
  if (!searchQuery.value) return availableLanguages;
  
  const query = searchQuery.value.toLowerCase();
  return availableLanguages.filter(lang => 
    lang.nativeName.toLowerCase().includes(query) || 
    lang.englishName.toLowerCase().includes(query) ||
    lang.code.toLowerCase().includes(query)
  );
});

// 实时应用主题设置
const updateTheme = async (theme: ThemeType) => {
  activeTheme.value = theme;
  await userStore.setTheme(theme);
  showFeedback('theme');
};

// 实时应用语言设置
const updateLanguage = async (lang: string) => {
  activeLanguage.value = lang;
  await userStore.setLanguage(lang);
  locale.value = lang;
  isLanguageDropdownOpen.value = false; // 关闭下拉菜单
  showFeedback('language');
};

// 切换语言下拉菜单的显示状态
const toggleLanguageDropdown = () => {
  isLanguageDropdownOpen.value = !isLanguageDropdownOpen.value;
  if (isLanguageDropdownOpen.value) {
    // 重置搜索框
    searchQuery.value = '';
    // 添加延迟后聚焦搜索框
    setTimeout(() => {
      const searchInput = document.querySelector('.language-search-input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 100);
  }
};

// 点击外部关闭下拉菜单
const closeLanguageDropdown = (event: Event) => {
  const target = event.target as HTMLElement;
  const dropdown = document.querySelector('.language-dropdown');
  const selector = document.querySelector('.language-selector');
  
  if (dropdown && selector && 
      !dropdown.contains(target) && 
      !selector.contains(target)) {
    isLanguageDropdownOpen.value = false;
  }
};

// 阻止搜索输入框点击事件冒泡，防止关闭下拉菜单
const stopPropagation = (event: Event) => {
  event.stopPropagation();
};

// 监听点击事件，用于关闭下拉菜单
onMounted(() => {
  document.addEventListener('click', closeLanguageDropdown);
});

// 显示设置成功的反馈
const feedbackItems = ref(new Map<string, boolean>());

const showFeedback = (settingType: string) => {
  feedbackItems.value.set(settingType, true);
  setTimeout(() => {
    feedbackItems.value.set(settingType, false);
  }, 2000);
};

// 主题图标映射
const themeIcons: Record<string, string> = {
  'light': '☀️',
  'dark': '🌙',
  'system': '💻',
};

// 获取国家/地区代码（用于显示）
const getCountryCode = (langCode: string) => {
  const language = getLanguageByCode(langCode);
  const emoji = language?.flagEmoji || '';
  
  // 国旗emoji是两个Unicode区域指示符字符，提取对应的字母作为国家代码
  // 例如：🇨🇳 = 区域指示符C + 区域指示符N = CN
  if (emoji && emoji.length === 2 && emoji !== '🌐') {
    // 提取字符的码点并转换为国家代码字母
    const codePoints = Array.from(emoji).map(char => char.codePointAt(0) as number);
    if (codePoints.length === 2) {
      const firstLetter = String.fromCodePoint(codePoints[0] - 127397);
      const secondLetter = String.fromCodePoint(codePoints[1] - 127397);
      return firstLetter + secondLetter;
    }
  }
  
  return '??';
};
</script>

<template>
  <div class="p-6 w-full min-h-screen">
    <div class="flex items-center mb-10">
      <span class="material-icons text-4xl mr-3 text-primary">settings</span>
      <h1 class="text-4xl font-bold">{{ $t('setting.title') }}</h1>
    </div>
    
    <div class="space-y-12">
      <!-- 主题设置 -->
      <section>
        <div class="mb-6 flex items-center">
          <span class="material-icons text-2xl mr-3 text-primary">palette</span>
          <h2 class="text-2xl font-semibold">{{ $t('setting.theme') }}</h2>
          <div class="ml-auto transition-all duration-300" 
               :class="{'opacity-100': feedbackItems.get('theme'), 'opacity-0': !feedbackItems.get('theme')}">
            <span class="inline-flex items-center px-3 py-1 bg-success/20 text-success rounded-full">
              <span class="material-icons text-sm mr-1">check_circle</span>
              <span>已应用</span>
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="theme in ['light', 'dark', 'system']" 
               :key="theme"
               class="theme-card"
               :class="{'active': activeTheme === theme}"
               @click="updateTheme(theme as ThemeType)">
            <div class="theme-icon" :class="`theme-${theme}`">
              <span class="text-2xl">{{ themeIcons[theme] }}</span>
            </div>
            <div class="theme-info">
              <h3 class="text-lg font-medium">{{ $t(`setting.theme_options.${theme}`) }}</h3>
              <div class="theme-check">
                <span class="material-icons check-icon" :class="{'visible': activeTheme === theme}">
                  check_circle
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 语言设置 - 重新设计 -->
      <section>
        <div class="mb-6 flex items-center">
          <span class="material-icons text-2xl mr-3 text-primary">translate</span>
          <h2 class="text-2xl font-semibold">{{ $t('setting.language') }}</h2>
          <div class="ml-auto transition-all duration-300" 
               :class="{'opacity-100': feedbackItems.get('language'), 'opacity-0': !feedbackItems.get('language')}">
            <span class="inline-flex items-center px-3 py-1 bg-success/20 text-success rounded-full">
              <span class="material-icons text-sm mr-1">check_circle</span>
              <span>已应用</span>
            </span>
          </div>
        </div>
        
        <div class="relative z-10 w-full">
          <!-- 语言选择器 -->
          <div class="language-selector" @click="toggleLanguageDropdown">
            <div class="flex items-center">
              <div class="flag-container mr-3">
                <div class="flag">
                  <span class="flag-emoji">{{ currentLanguage.flagEmoji }}</span>
                  <span class="country-code">{{ getCountryCode(currentLanguage.code) }}</span>
                </div>
              </div>
              <div class="language-info flex-grow">
                <div class="language-name font-medium">{{ currentLanguage.nativeName }}</div>
                <div class="language-english text-sm text-base-content/70">{{ currentLanguage.englishName }}</div>
              </div>
              <div class="language-arrow transition-transform" :class="{'rotate-180': isLanguageDropdownOpen}">
                <span class="material-icons">expand_more</span>
              </div>
            </div>
          </div>
          
          <!-- 语言下拉菜单，添加animation效果 -->
          <transition name="dropdown">
            <div v-if="isLanguageDropdownOpen" class="language-dropdown">
              <div class="dropdown-header">
                <span class="material-icons text-sm mr-1">language</span>
                <span class="text-sm font-medium">选择语言 (Select Language)</span>
              </div>
              
              <!-- 搜索框 -->
              <div class="language-search">
                <div class="relative">
                  <input 
                    type="text" 
                    class="language-search-input w-full py-2 pl-10 pr-4 border-b border-base-300 focus:outline-none focus:border-primary" 
                    placeholder="搜索语言..." 
                    v-model="searchQuery"
                    @click="stopPropagation"
                  >
                  <span class="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-base-content/50">search</span>
                </div>
              </div>
              
              <!-- 语言列表 -->
              <div class="dropdown-items">
                <div v-for="language in filteredLanguages" 
                     :key="language.code"
                     class="dropdown-item"
                     :class="{'active': activeLanguage === language.code}"
                     @click="updateLanguage(language.code)">
                  <div class="flag-container mr-3">
                    <div class="flag">
                      <span class="flag-emoji">{{ language.flagEmoji }}</span>
                      <span class="country-code">{{ getCountryCode(language.code) }}</span>
                    </div>
                  </div>
                  <div class="language-info flex-grow">
                    <div class="language-name font-medium">{{ language.nativeName }}</div>
                    <div class="language-english text-sm text-base-content/70">{{ language.englishName }}</div>
                  </div>
                  <span v-if="activeLanguage === language.code" class="material-icons text-primary">check</span>
                </div>
                
                <!-- 没有匹配结果时显示提示 -->
                <div v-if="filteredLanguages.length === 0" class="empty-result">
                  <p class="text-center py-4 text-base-content/70">未找到匹配的语言</p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 禁止整个设置页面的文本选择 */
.p-6 {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* 允许搜索框可选择 */
.language-search-input {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
}

.theme-card {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  border-radius: 1rem;
  background-color: hsl(var(--b1));
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.theme-card.active {
  border-color: hsl(var(--p));
  background-color: hsl(var(--p) / 0.1);
}

.theme-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  background-color: hsl(var(--b2));
}

.theme-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-check {
  display: flex;
  align-items: center;
}

.check-icon {
  color: hsl(var(--p));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.check-icon.visible {
  opacity: 1;
}

.theme-light {
  background-color: #f8fafc;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.theme-dark {
  background-color: #0f172a;
  color: #f8fafc;
}

.theme-system {
  background: linear-gradient(to right, #f8fafc 50%, #0f172a 50%);
  color: #6366f1;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

/* 新的语言选择器样式 */
.language-selector {
  background-color: hsl(var(--b1));
  border: 2px solid hsl(var(--b2));
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  position: relative;
}

.language-selector:hover {
  border-color: hsl(var(--p) / 0.5);
  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  width: 100%;
  background-color: hsl(var(--b1));
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid hsl(var(--b2));
  overflow: hidden;
  z-index: 20;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 语言搜索框样式 */
.language-search {
  padding: 0.5rem;
  background-color: hsl(var(--b1));
  border-bottom: 1px solid hsl(var(--b2));
}

.language-search-input {
  background-color: hsl(var(--b1));
  color: hsl(var(--bc));
}

.language-search-input:focus {
  background-color: hsl(var(--b2));
}

/* 下拉内容区 */
.dropdown-header {
  padding: 0.75rem 1rem;
  background-color: hsl(var(--b2));
  color: hsl(var(--bc));
  display: flex;
  align-items: center;
  border-bottom: 1px solid hsl(var(--b3));
}

.dropdown-items {
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: hsl(var(--b2));
}

.dropdown-item.active {
  background-color: hsl(var(--p) / 0.1);
  color: hsl(var(--p));
}

.language-arrow {
  color: hsl(var(--bc) / 0.6);
  transition: transform 0.3s;
}

/* 新的国旗样式 - 使用emoji */
.flag-container {
  width: 24px;
  height: 24px;
  position: relative;
  overflow: hidden;
}

.flag {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

/* Emoji 样式 */
.flag-emoji {
  font-size: 1.2rem;
  line-height: 1;
  font-family: var(--emoji-font);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 国家代码样式，当emoji不可用时显示 */
.country-code {
  font-size: 0.7rem;
  font-weight: bold;
  color: transparent;
  z-index: 0;
  position: absolute;
}

/* 当emoji加载失败时显示国家代码 */
.flag-emoji:not(:defined) ~ .country-code,
.flag-emoji.failed ~ .country-code {
  color: hsl(var(--bc));
  background-color: hsl(var(--b2));
}

/* 删除旧的国旗样式 */
.zh-flag, .en-flag, .other-flag,
.zh-flag::before, .zh-flag::after,
.en-flag::before, .en-flag::after,
.other-flag::before {
  background: none;
  background-color: transparent;
  content: none;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.active {
  animation: pulse 2s ease-in-out 1;
}

/* 滚动条样式 */
.dropdown-items::-webkit-scrollbar {
  width: 6px;
}

.dropdown-items::-webkit-scrollbar-track {
  background: hsl(var(--b2));
  border-radius: 10px;
}

.dropdown-items::-webkit-scrollbar-thumb {
  background: hsl(var(--p) / 0.3);
  border-radius: 10px;
}

.dropdown-items::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--p) / 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-card {
    padding: 1rem;
  }
  
  .theme-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
}

.dropdown-item,
.dropdown-header,
.language-selector,
.theme-card,
.theme-info,
.theme-icon,
.flag-container,
.language-info,
.language-name,
.language-english,
.material-icons,
.dropdown-items {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
</style>