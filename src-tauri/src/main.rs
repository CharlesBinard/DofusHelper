#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::{command, generate_handler, Emitter, Manager, State, WebviewWindow, Window};
use windows::{
    Win32::Foundation::{BOOL, HWND, LPARAM},
    Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId},
    Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetForegroundWindow, GetWindowTextA, IsWindowVisible, SetForegroundWindow,GetWindowThreadProcessId,
        ShowWindow, SW_RESTORE,
    },
};
use tokio::time::{self, Duration};

#[derive(Serialize, Clone)]
struct DofusWindow {
    title: String,
    hwnd: usize,
    name: String,
    class: String,
}

struct WindowManager {
    windows: Vec<DofusWindow>,
    current_index: usize,
}

impl WindowManager {
    fn new() -> Self {
        Self {
            windows: Vec::new(),
            current_index: 0,
        }
    }

    fn refresh_windows(&mut self) {
        let new_windows = get_dofus_windows();
        if new_windows.len() != self.windows.len() {
            self.current_index = 0;
        } else if self.current_index >= new_windows.len() {
            self.current_index = 0;
        }
        self.windows = new_windows;
    }
    

    fn next_window(&mut self) -> Option<&DofusWindow> {
        if self.windows.is_empty() {
            return None;
        }
        self.current_index = (self.current_index + 1) % self.windows.len();
        self.windows.get(self.current_index)
    }

    fn previous_window(&mut self) -> Option<&DofusWindow> {
        if self.windows.is_empty() {
            return None;
        }
        self.current_index = (self.current_index + self.windows.len() - 1) % self.windows.len();
        self.windows.get(self.current_index)
    }
}

#[command]
fn get_dofus_windows() -> Vec<DofusWindow> {
    let mut windows = Vec::new();
    unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        if !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1);
        }

        let windows = &mut *(lparam.0 as *mut Vec<DofusWindow>);
        if let Some(title) = get_window_title(hwnd) {
            if title.contains("- Beta") {
                let parts: Vec<&str> = title.split(" - ").collect();
                if parts.len() >= 2 {
                    windows.push(DofusWindow {
                        title: title.clone(),
                        hwnd: hwnd.0 as usize,
                        name: parts[0].to_string(),
                        class: parts[1].to_string(),
                    });
                }
            }
        }
        BOOL(1)
    }

    unsafe {
        let _ = EnumWindows(Some(enum_windows_proc), LPARAM(&mut windows as *mut _ as isize));
    }

    windows
}

fn get_window_title(hwnd: HWND) -> Option<String> {
    unsafe {
        let mut buffer = [0u8; 512];
        let len = GetWindowTextA(hwnd, &mut buffer);
        if len == 0 {
            return None;
        }
        String::from_utf8(buffer[..len as usize].to_vec()).ok()
    }
}

#[command]
fn get_active_dofus_window() -> Option<DofusWindow> {
    unsafe {
        let active_hwnd = GetForegroundWindow();
        let windows = get_dofus_windows();
        windows.into_iter().find(|w| w.hwnd == active_hwnd.0 as usize)
    }
}

#[command]
fn focus_window_command(hwnd: usize, window: Window) -> Result<(), String> {
    focus_window(hwnd, &window).map_err(|e| e.to_string())
}

fn focus_window(hwnd: usize, window: &Window) -> Result<(), String> {
    let hwnd = HWND(hwnd as *mut _);
    unsafe {
        let current_thread_id = GetCurrentThreadId();
        let target_thread_id = GetWindowThreadProcessId(hwnd, None);

        if !AttachThreadInput(current_thread_id, target_thread_id, true).as_bool() {
            return Err("Failed to attach thread input".into());
        }

        let _ = ShowWindow(hwnd, SW_RESTORE);
        let _ = SetForegroundWindow(hwnd);

        if !AttachThreadInput(current_thread_id, target_thread_id, false).as_bool() {
            return Err("Failed to detach thread input".into());
        }
    }
    emit_active_window_changed(window)?;

    Ok(())
}

#[command]
fn set_tauri_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[command]
fn is_focused_on_app(window: WebviewWindow) -> Result<bool, String> {
    unsafe {
        let active_hwnd = GetForegroundWindow();
        let app_hwnd = window
            .hwnd()
            .map_err(|e| e.to_string())?;
        Ok(active_hwnd == app_hwnd)
    }
}

#[command]
fn set_window_size(window: Window, width: f64, height: f64) -> Result<(), String> {
    let new_size = tauri::LogicalSize::new(width, height);
    window
        .set_size(new_size)
        .map_err(|e| e.to_string())
}

#[command]
async fn next_window(
    state: State<'_, Arc<Mutex<WindowManager>>>,
    window: Window,
) -> Result<(), String> {
    println!("Command 'next_window' invoked");
    let mut manager = state.lock().map_err(|_| "Failed to lock WindowManager".to_string())?;
    if let Some(next_win) = manager.next_window() {
        println!("Focusing window: {}", next_win.title);
        focus_window(next_win.hwnd, &window)?;
    }
    Ok(())
}

#[command]
async fn prev_window(
    state: State<'_, Arc<Mutex<WindowManager>>>,
    window: Window,
) -> Result<(), String> {
    println!("Command 'prev_window' invoked");
    let mut manager = state.lock().map_err(|_| "Failed to lock WindowManager".to_string())?;
    if let Some(prev_win) = manager.previous_window() {
        println!("Focusing window: {}", prev_win.title);
        focus_window(prev_win.hwnd, &window)?;
    }
    Ok(())
}

fn emit_active_window_changed(window: &Window) -> Result<(), String> {
    if let Some(active_window) = get_active_dofus_window() {
        let payload = serde_json::to_value(&active_window).map_err(|e| e.to_string())?;
        window.emit("active_window_changed", payload).map_err(|e| e.to_string())
    } else {
        window.emit("active_window_changed", serde_json::json!(null)).map_err(|e| e.to_string())
    }
}

#[tokio::main]
async fn main() {
    let window_manager = Arc::new(Mutex::new(WindowManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(window_manager.clone())
        .invoke_handler(generate_handler![
            get_dofus_windows,
            get_active_dofus_window,
            focus_window_command,
            set_tauri_always_on_top,
            set_window_size,
            next_window,
            prev_window,
            is_focused_on_app
        ])
        .setup(move |app| {
            let window = app.get_webview_window("main").ok_or("Failed to get main window")?;
            let mut wm = window_manager.lock().map_err(|_| "Failed to lock WindowManager")?;
            wm.refresh_windows();
            let _ =  window.set_always_on_top(true);

            let window_clone = window.clone();
            tokio::spawn(async move {
                let mut interval = time::interval(Duration::from_secs(1));
                let mut last_focus: bool = false;

                loop {
                    interval.tick().await;

                    match is_focused_on_app(window_clone.clone()) {
                        Ok(is_focused) => {
                            if is_focused != last_focus {
                                last_focus = is_focused;
                                if let Err(e) = window_clone.emit("focus_changed", is_focused) {
                                    eprintln!("Failed to emit focus_changed: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Error checking focus: {}", e);
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Failed to run Tauri application");
}