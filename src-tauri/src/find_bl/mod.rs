#[cfg(target_os = "macos")]
mod find_bl_macos;
#[cfg(target_os = "windows")]
mod find_bl_win;
#[cfg(target_os = "linux")]
mod find_bl_linux;

#[cfg(target_os = "macos")]
use find_bl_macos::find_bl as platform_find_bl;
#[cfg(target_os = "windows")]
use find_bl_win::find_bl as platform_find_bl;
#[cfg(target_os = "linux")]
use find_bl_linux::find_bl as platform_find_bl;

use crate::hslink_backend;

#[tauri::command]
pub fn find_bl() -> Result<String, hslink_backend::HSLinkError> {
    platform_find_bl()
}
