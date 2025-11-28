use nusb::hotplug::HotplugEvent;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

// HSLink 设备的 VID 和 PID
const HSLINK_VID: u16 = 0x0D28;
const HSLINK_PID: u16 = 0x0204;

// 设备连接后等待枚举完成的延迟时间
const DEVICE_ENUM_DELAY_MS: u64 = 500;

static HOTPLUG_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, serde::Serialize)]
pub struct UsbDeviceEvent {
    pub event_type: String, // "connected" 或 "disconnected"
    pub vid: u16,
    pub pid: u16,
}

/// 启动 USB 热插拔监听
pub fn start_hotplug_listener(app_handle: AppHandle) {
    // 防止重复启动
    if HOTPLUG_RUNNING.swap(true, Ordering::SeqCst) {
        println!("Hotplug listener already running");
        return;
    }

    thread::spawn(move || {
        println!("Starting USB hotplug listener...");

        let hotplug_watch = match nusb::watch_devices() {
            Ok(watch) => watch,
            Err(e) => {
                println!("Failed to start hotplug watch: {:?}", e);
                HOTPLUG_RUNNING.store(false, Ordering::SeqCst);
                return;
            }
        };

        for event in futures_lite::stream::block_on(hotplug_watch) {
            match event {
                HotplugEvent::Connected(device_info) => {
                    let vid = device_info.vendor_id();
                    let pid = device_info.product_id();

                    println!("USB Device connected: VID={:04X}, PID={:04X}", vid, pid);

                    // 检查是否是 HSLink 设备
                    if vid == HSLINK_VID && pid == HSLINK_PID {
                        println!("HSLink device connected!");
                        
                        // 等待设备完成枚举，否则 hidapi 可能还无法列出设备
                        thread::sleep(Duration::from_millis(DEVICE_ENUM_DELAY_MS));
                        
                        let _ = app_handle.emit(
                            "hslink-device-changed",
                            UsbDeviceEvent {
                                event_type: "connected".to_string(),
                                vid,
                                pid,
                            },
                        );
                    }
                }
                HotplugEvent::Disconnected(device_id) => {
                    println!("USB Device disconnected: {:?}", device_id);

                    // 对于断开事件，我们无法直接获取 VID/PID
                    // 所以直接通知前端刷新设备列表
                    let _ = app_handle.emit(
                        "hslink-device-changed",
                        UsbDeviceEvent {
                            event_type: "disconnected".to_string(),
                            vid: 0,
                            pid: 0,
                        },
                    );
                }
            }
        }

        HOTPLUG_RUNNING.store(false, Ordering::SeqCst);
        println!("USB hotplug listener stopped");
    });
}
