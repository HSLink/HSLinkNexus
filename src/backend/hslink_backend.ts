import { invoke } from '@tauri-apps/api/core';

export async function hslink_list_device() {
  try {
    let res = await invoke('hslink_list_device', {});
    return res as string[];
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function hslink_open_device(sn: string) {
  try {
    let res = await invoke('hslink_open_device', { serialNumber: sn });
    return 'success';
  } catch (error) {
    console.log(error);
    return error as string;
  }
}

export async function hslink_write(data: Uint8Array | ArrayBuffer | string) {
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);
  }
  try {
    let res = await invoke('hslink_write', { data: data });
    return 'success';
  } catch (error) {
    console.log(error);
    return error as string;
  }
}

export async function hslink_write_wait_rsp(
  data: Uint8Array | ArrayBuffer | string,
  timeout: number,
) {
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);
  }
  try {
    let res = await invoke('hslink_write_wait_rsp', { data: data, timeout: timeout });
    return res as string;
  } catch (error) {
    console.log(error);
    return error as string;
  }
}
