use std::path::Path;

#[tauri::command]
pub fn copy_file(src: String, dst: String) -> Result<String, String> {
    println!("src: {}", src);
    println!("dst: {}", dst);
    let src_path = Path::new(&src);
    let dst_path = Path::new(&dst);
    match std::fs::copy(src_path, dst_path) {
        Ok(_) => Ok("Copy file success".to_string()),
        Err(e) => Err(format!("Copy file error: {}", e)),
    }
}
