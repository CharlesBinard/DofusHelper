#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::Serialize;
use std::ffi::c_void;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{
    command, generate_handler, Emitter, Manager, State, WebviewWindow, Window,
};
use tokio::time::{self, Duration};
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, POINT, WPARAM};
use windows::Win32::System::Threading::{
    AttachThreadInput, GetCurrentThreadId,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetCursorPos, GetForegroundWindow, GetWindowTextA, IsWindowVisible,GetWindowThreadProcessId,
    PostMessageA, SetForegroundWindow, ShowWindow, SW_RESTORE, WM_LBUTTONDOWN,
    WM_LBUTTONUP,
};

#[derive(Serialize, Clone, Debug, PartialEq, Eq)]
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
        if new_windows.len() != self.windows.len() || self.current_index >= new_windows.len() {
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

mod windows_api {
    use super::*;
    
    pub fn get_window_title(hwnd: HWND) -> Option<String> {
        unsafe {
            let mut buffer = [0u8; 512];
            let len = GetWindowTextA(hwnd, &mut buffer);
            if len == 0 {
                return None;
            }
            String::from_utf8(buffer[..len as usize].to_vec()).ok()
        }
    }

    pub fn make_lparam(x: i32, y: i32) -> LPARAM {
        LPARAM(((y & 0xFFFF) << 16 | (x & 0xFFFF)) as isize)
    }

    pub fn send_click(hwnd: HWND, pos: POINT) -> Result<(), String> {
        unsafe {
            PostMessageA(
                hwnd,
                WM_LBUTTONDOWN,
                WPARAM(0x0001),
                make_lparam(pos.x, pos.y),
            )
            .ok().ok_or_else(|| "Failed to post WM_LBUTTONDOWN".to_string())?;


            thread::sleep(Duration::from_millis(50));

            PostMessageA(
                hwnd,
                WM_LBUTTONUP,
                WPARAM(0x0000),
                make_lparam(pos.x, pos.y),
            )
            .ok()
            .ok_or_else(|| "Failed to post WM_LBUTTONUP".to_string())
        }
    }

    pub fn focus_window(hwnd: HWND) -> Result<(), String> {
        unsafe {
            let current_thread_id = GetCurrentThreadId();
            let target_thread_id = GetWindowThreadProcessId(hwnd, None);

            if !AttachThreadInput(current_thread_id, target_thread_id, true).as_bool() {
                return Err("Failed to attach thread input".to_string());
            }

            ShowWindow(hwnd, SW_RESTORE).ok().map_err(|_| "Failed to restore window".to_string())?;
            SetForegroundWindow(hwnd).ok().map_err(|_| "Failed to set foreground window".to_string())?;

            if !AttachThreadInput(current_thread_id, target_thread_id, false).as_bool() {
                return Err("Failed to detach thread input".to_string());
            }
        }
        Ok(())
    }

    pub fn enumerate_dofus_windows() -> Vec<DofusWindow> {
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
            EnumWindows(
                Some(enum_windows_proc),
                LPARAM(&mut windows as *mut _ as isize),
            )
            .ok();
        }

        windows
    }
}

use windows_api::*;

#[command]
fn get_dofus_windows() -> Vec<DofusWindow> {
    enumerate_dofus_windows()
}

#[command]
fn click_all_windows() -> Result<(), String> {
    let mut cursor_pos = POINT::default();
    unsafe {
        if GetCursorPos(&mut cursor_pos).is_err() {
            return Err("Échec de la récupération de la position du curseur".into());
        }
    }

    let dofus_windows = get_dofus_windows();

    for win in dofus_windows {
        let cursor_pos = cursor_pos;
        let hwnd_raw = win.hwnd as isize;

        thread::spawn(move || {
            let hwnd = HWND(hwnd_raw as *mut c_void);
            let client_pos = cursor_pos;

            if let Err(e) = send_click(hwnd, client_pos) {
                eprintln!("Erreur lors de l'envoi du clic: {}", e);
            }

            thread::sleep(Duration::from_millis(100));
        });
    }

    Ok(())
}

#[command]
fn click_all_windows_with_delay(delay_ms: Option<u64>) -> Result<(), String> {
    let delay = delay_ms.unwrap_or(100); // 100 ms par défaut

    let mut cursor_pos = POINT::default();
    unsafe {
        if GetCursorPos(&mut cursor_pos).is_err() {
            return Err("Échec de la récupération de la position du curseur".into());
        }
    }

    let dofus_windows = get_dofus_windows();

    for win in dofus_windows {
        let hwnd = HWND(win.hwnd as *mut c_void);
        let client_pos = cursor_pos;

        if let Err(e) = send_click(hwnd, client_pos) {
            eprintln!("Erreur lors de l'envoi du clic: {}", e);
        }

        thread::sleep(Duration::from_millis(delay));
    }

    Ok(())
}



#[command]
fn get_active_dofus_window() -> Option<DofusWindow> {
    let active_hwnd = unsafe { GetForegroundWindow() };
    let windows = get_dofus_windows();
    windows.into_iter().find(|w| w.hwnd == active_hwnd.0 as usize)
}

#[command]
fn focus_window_command(hwnd: usize, window: Window) -> Result<(), String> {
    focus_window(HWND(hwnd as *mut c_void)).map_err(|e| e.to_string())?;
    emit_active_dofus_changed(&window)?;
    Ok(())
}

#[command]
fn set_tauri_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[command]
fn is_focused_on_app_or_dofus(window: WebviewWindow) -> Result<bool, String> {
    unsafe {
        let active_hwnd = GetForegroundWindow();
        let app_hwnd = window
            .hwnd()
            .map_err(|e| e.to_string())?;
        let dofus_hwnd = get_active_dofus_window()
            .map(|w| HWND(w.hwnd as *mut c_void));
        Ok(active_hwnd == app_hwnd || Some(active_hwnd) == dofus_hwnd)
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
    println!("Commande 'next_window' invoquée");
    let mut manager = state
        .lock()
        .map_err(|_| "Échec du verrouillage de WindowManager".to_string())?;
    if let Some(next_win) = manager.next_window() {
        println!("Focalisation sur la fenêtre: {}", next_win.title);
        focus_window(HWND(next_win.hwnd as *mut c_void)).map_err(|e| e.to_string())?;
        emit_active_dofus_changed(&window)?;
    }
    Ok(())
}

#[command]
async fn prev_window(
    state: State<'_, Arc<Mutex<WindowManager>>>,
    window: Window,
) -> Result<(), String> {
    println!("Commande 'prev_window' invoquée");
    let mut manager = state
        .lock()
        .map_err(|_| "Échec du verrouillage de WindowManager".to_string())?;
    if let Some(prev_win) = manager.previous_window() {
        println!("Focalisation sur la fenêtre: {}", prev_win.title);
        focus_window(HWND(prev_win.hwnd as *mut c_void)).map_err(|e| e.to_string())?;
        emit_active_dofus_changed(&window)?;
    }
    Ok(())
}

fn emit_active_dofus_changed(window: &Window) -> Result<(), String> {
    if let Some(active_dofus) = get_active_dofus_window() {
        let payload = serde_json::to_value(&active_dofus).map_err(|e| e.to_string())?;
        window
            .emit("active_dofus_changed", payload)
            .map_err(|e| e.to_string())
    } else {
        window
            .emit("active_dofus_changed", serde_json::json!(null))
            .map_err(|e| e.to_string())
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
            click_all_windows,
            click_all_windows_with_delay,
        ])
        .setup(move |app| {
            let window = app
                .get_webview_window("main")
                .ok_or("Échec de récupération de la fenêtre principale")?;
            let mut wm = window_manager
                .lock()
                .map_err(|_| "Échec du verrouillage de WindowManager")?;
            wm.refresh_windows();
            window.set_always_on_top(true)?;

            let window_clone = window.clone();
            tokio::spawn(async move {
                let mut interval = time::interval(Duration::from_millis(500));
                let mut last_focus: bool = false;

                loop {
                    interval.tick().await;

                    match is_focused_on_app_or_dofus(window_clone.clone()) {
                        Ok(is_focused) => {
                            if is_focused != last_focus {
                                last_focus = is_focused;
                                if let Err(e) = window_clone.emit(
                                    "is_focused_on_app_or_dofus",
                                    is_focused,
                                ) {
                                    eprintln!(
                                        "Échec de l'émission de is_focused_on_app_or_dofus: {}",
                                        e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Erreur lors de la vérification du focus: {}", e);
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Échec du lancement de l'application Tauri");
}
