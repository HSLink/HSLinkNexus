use crate::hslink_backend::HSLinkError;
use std::path::Path;
use std::process::Command;

const VOLUME_NAME: &str = "CHERRYUF2";

/// 尝试在常见的挂载路径查找 CHERRYUF2
fn find_in_common_paths() -> Option<String> {
    // 获取当前用户名
    let username = std::env::var("USER").unwrap_or_default();

    // 常见的自动挂载路径
    let common_paths = vec![
        format!("/media/{}/{}", username, VOLUME_NAME),
        format!("/run/media/{}/{}", username, VOLUME_NAME),
        format!("/mnt/{}", VOLUME_NAME),
        format!("/media/{}", VOLUME_NAME),
    ];

    for path_str in common_paths {
        let path = Path::new(&path_str);
        if path.exists() && path.is_dir() {
            println!("Found CHERRYUF2 volume at: {}", path_str);
            return Some(path_str);
        }
    }

    None
}

/// 使用 lsblk 命令查找 CHERRYUF2 设备的挂载点
fn find_with_lsblk() -> Option<String> {
    // lsblk -o LABEL,MOUNTPOINT -n -l
    let output = Command::new("lsblk")
        .args(["-o", "LABEL,MOUNTPOINT", "-n", "-l"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 && parts[0] == VOLUME_NAME {
            let mountpoint = parts[1].to_string();
            println!("Found CHERRYUF2 via lsblk at: {}", mountpoint);
            return Some(mountpoint);
        }
    }

    None
}

pub fn find_bl() -> Result<String, HSLinkError> {
    // 1. 首先检查常见路径
    if let Some(path) = find_in_common_paths() {
        return Ok(path);
    }

    // 2. 尝试使用 lsblk 命令（可以找到非标准挂载点）
    if let Some(path) = find_with_lsblk() {
        return Ok(path);
    }

    println!("CHERRYUF2 volume not found");
    Err(HSLinkError::DeviceNotFound)
}
