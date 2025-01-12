mod hslink_backend;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,

            hslink_backend::hslink_list_device,
            hslink_backend::hslink_open_device,
            hslink_backend::hslink_write,
            hslink_backend::hslink_write_wait_rsp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
