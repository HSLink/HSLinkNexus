mod copy_file;
mod find_bl;
mod hslink_backend;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            hslink_backend::hslink_list_device,
            hslink_backend::hslink_open_device,
            hslink_backend::hslink_write,
            hslink_backend::hslink_write_wait_rsp,
            find_bl::find_bl,
            copy_file::copy_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
