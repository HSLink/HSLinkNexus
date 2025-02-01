use serde_json::{Map, Value};
use std::process::Command;
use std::{env, fs};

fn modify_version() {
    println!("cargo:rerun-if-changed=tauri.conf.json");

    // 获取 Git 版本号
    let git_version = Command::new("git")
        .args(&["describe", "--tags", "--always"])
        .output()
        .ok()
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|s| s.trim().to_string());

    // 解析版本号，确保符合 SemVer
    let semver_version = match git_version {
        Some(version) if version.starts_with('v') => {
            // v1.0.0 → 1.0.0
            version[1..].to_string()
        }
        Some(version) if version.contains('-') => {
            // v1.0.0-1-gabcdef → 1.0.0+1+gabcdef
            version.replace("-", "+")
        }
        Some(version) => {
            // 纯 hash 情况，fallback
            format!("0.0.1+{}", version)
        }
        None => "0.0.1+unknown".to_string(),
    };

    let number_version = semver_version
        .split('+')
        .next()
        .unwrap_or("0.0.1")
        .to_string();

    // 读取 `tauri.conf.json`
    // 获取当前工作目录
    let current_dir = env::current_dir().expect("Failed to get current directory");
    println!("Current directory: {:?}", current_dir);

    // 期望的 `tauri.conf.json` 路径
    let config_path = if current_dir.ends_with("src-tauri") {
        "tauri.conf.json" // 直接在 `src-tauri/` 目录下
    } else {
        "src-tauri/tauri.conf.json" // 在项目根目录下
    };

    // 读取 `tauri.conf.json`
    let config_content = fs::read_to_string(config_path).expect("Failed to read tauri.conf.json");

    // 解析 JSON
    let mut config_json: Value =
        serde_json::from_str(&config_content).expect("Failed to parse JSON");

    // 修改 `version`, 给打包器用的纯数字版本
    config_json["version"] = Value::String(number_version.clone());

    // 转回 JSON 格式
    let new_config_content =
        serde_json::to_string_pretty(&config_json).expect("Failed to serialize JSON");

    // 写回 `tauri.conf.json`
    fs::write(config_path, new_config_content).expect("Failed to update tauri.conf.json");

    // FIXME 比较奇怪的是nsis打包器会使用修改前的版本号

    // 同样的方式处理package.json
    let package_path = if current_dir.ends_with("src-tauri") {
        "../package.json"
    } else {
        "package.json"
    };
    let package_content = fs::read_to_string(package_path).expect("Failed to read package.json");
    let mut package_json: Map<String, Value> =
        serde_json::from_str(&package_content).expect("Failed to parse JSON");
    package_json.insert("version".to_string(), Value::String(semver_version.clone()));
    let new_package_content =
        serde_json::to_string_pretty(&package_json).expect("Failed to serialize JSON");
    fs::write(package_path, new_package_content).expect("Failed to update package.json");

    println!(
        "Updated tauri.conf.json and package.json with version: {}",
        semver_version
    );
}

fn main() {
    modify_version();

    tauri_build::build()
}
