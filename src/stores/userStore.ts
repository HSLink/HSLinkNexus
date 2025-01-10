import {defineStore} from 'pinia';
import {load} from "@tauri-apps/plugin-store";

const store = await load('store.json', {autoSave: false});

export const useUserStore = defineStore('user', {
    state: () => ({
        language: '',
    }),
    actions: {
        async loadLanguage() {
            const val = await store.get<{ value: string }>('language');
            if (val) {
                console.log(`Get language ${val.value}`)
                this.language = val.value;
            } else {
                console.log('No language found, use default language zh')
                this.language = 'zh';
            }
        },
        async setLanguage(language: string) {
            this.language = language;
            // 保存到本地存储
            await store.set('language', {value: language});
            await store.save();
        },

        async loadAll() {
            await this.loadLanguage()
        }
    },
});
