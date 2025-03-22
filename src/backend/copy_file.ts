import {invoke} from "@tauri-apps/api/core";

export async function copy_file(src: string, dst: string) {
  try {
    let res = await invoke("copy_file", {src: src, dst: dst})
    return res as string;
  } catch (error) {
    console.log(error);
    return error as string
  }
}
