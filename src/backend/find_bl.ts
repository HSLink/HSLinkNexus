import { invoke } from '@tauri-apps/api/core';

export async function hslink_find_bl() {
  try {
    let res = await invoke('find_bl', {});
    return res as string;
  } catch (error) {
    console.log(error);
    return error as string;
  }
}
