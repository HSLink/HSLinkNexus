use crate::hslink_backend::HSLinkError;
use std::path::Path;

const VOLUME_NAME: &str = "CHERRYUF2";

pub fn find_bl() -> Result<String, HSLinkError> {
    // macOS 自动将 USB 存储设备挂载到 /Volumes/ 目录
    // 卷标会作为子目录名
    let volume_path = format!("/Volumes/{}", VOLUME_NAME);
    let path = Path::new(&volume_path);

    if path.exists() && path.is_dir() {
        println!("Found CHERRYUF2 volume at: {}", volume_path);
        Ok(volume_path)
    } else {
        println!("CHERRYUF2 volume not found at /Volumes/");
        Err(HSLinkError::DeviceNotFound)
    }
}
