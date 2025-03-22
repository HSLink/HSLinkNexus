use crate::hslink_backend;
use std::ffi::OsString;
use std::fs;
use std::os::windows::ffi::OsStringExt;
use std::path::Path;
use std::process::Command;
use std::ptr;
use winapi::um::fileapi::{GetLogicalDriveStringsW, GetVolumeInformationW};
use winapi::um::winnt::WCHAR;

/// 获取所有盘符
fn get_logical_drives() -> Vec<String> {
    let mut buffer = vec![0u16; 1024];
    let len = unsafe { GetLogicalDriveStringsW(buffer.len() as u32, buffer.as_mut_ptr()) };

    if len == 0 {
        return Vec::new();
    }

    let drive_str = OsString::from_wide(&buffer[..len as usize]);
    let drives: Vec<String> = drive_str
        .to_string_lossy()
        .split('\0')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();

    drives
}

/// 获取指定盘符的卷标
fn get_volume_label(drive: &str) -> Option<String> {
    let mut volume_name = vec![0u16; 256];
    let drive_wide: Vec<u16> = drive.encode_utf16().chain(std::iter::once(0)).collect();

    let result = unsafe {
        GetVolumeInformationW(
            drive_wide.as_ptr(),
            volume_name.as_mut_ptr(),
            volume_name.len() as u32,
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            0,
        )
    };

    if result != 0 {
        let label = OsString::from_wide(&volume_name)
            .to_string_lossy()
            .into_owned();
        Some(label.trim_end_matches('\0').to_string())
    } else {
        None
    }
}

/// 查找 CherryDAP 盘符
fn find_cherrydap_drive() -> Option<String> {
    let drives = get_logical_drives();
    for drive in &drives {
        if let Some(label) = get_volume_label(drive) {
            if label == "CHERRYUF2" {
                println!("Found CherryDAP drive: {}", drive);
                return Some(drive.clone());
            } else {
                println!("Drive {} has label {}", drive, label);
            }
        }
    }
    None
}

pub fn find_bl() -> Result<String, hslink_backend::HSLinkError> {
    match find_cherrydap_drive() {
        Some(drive) => Ok(drive),
        None => {
            println!("CherryDAP drive not found");
            Err(hslink_backend::HSLinkError::DeviceNotFound)
        }
    }
}
