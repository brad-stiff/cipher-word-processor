use std::fs;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
};

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let new_i = MenuItem::with_id(app, "file-new", "New", true, Some("CmdOrCtrl+N"))?;
            let open_i =
                MenuItem::with_id(app, "file-open", "Open…", true, Some("CmdOrCtrl+O"))?;
            let save_i =
                MenuItem::with_id(app, "file-save", "Save", true, Some("CmdOrCtrl+S"))?;
            let save_as_i = MenuItem::with_id(
                app,
                "file-save-as",
                "Save As…",
                true,
                Some("CmdOrCtrl+Shift+S"),
            )?;
            let change_pw_i = MenuItem::with_id(
                app,
                "file-change-password",
                "Change Password…",
                true,
                None::<&str>,
            )?;
            let close_tab_i = MenuItem::with_id(
                app,
                "file-close-tab",
                "Close Tab",
                true,
                Some("CmdOrCtrl+W"),
            )?;
            let export_i = MenuItem::with_id(
                app,
                "file-export-ciphertext",
                "Export Ciphertext…",
                true,
                None::<&str>,
            )?;
            let print_i = MenuItem::with_id(
                app,
                "file-print",
                "Print…",
                true,
                Some("CmdOrCtrl+P"),
            )?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_i = PredefinedMenuItem::quit(app, Some("Quit"))?;

            let file_menu = Submenu::with_items(
                app,
                "File",
                true,
                &[
                    &new_i,
                    &open_i,
                    &close_tab_i,
                    &save_i,
                    &save_as_i,
                    &change_pw_i,
                    &export_i,
                    &print_i,
                    &sep,
                    &quit_i,
                ],
            )?;

            let undo_i =
                MenuItem::with_id(app, "edit-undo", "Undo", true, Some("CmdOrCtrl+Z"))?;
            let redo_i = MenuItem::with_id(
                app,
                "edit-redo",
                "Redo",
                true,
                Some("CmdOrCtrl+Shift+Z"),
            )?;
            let edit_sep = PredefinedMenuItem::separator(app)?;
            let find_i =
                MenuItem::with_id(app, "edit-find", "Find…", true, Some("CmdOrCtrl+F"))?;
            let replace_i = MenuItem::with_id(
                app,
                "edit-replace",
                "Replace…",
                true,
                Some("CmdOrCtrl+H"),
            )?;
            let edit_menu = Submenu::with_items(
                app,
                "Edit",
                true,
                &[&undo_i, &redo_i, &edit_sep, &find_i, &replace_i],
            )?;

            let view_plain =
                MenuItem::with_id(app, "view-plain", "Plain", true, Some("CmdOrCtrl+1"))?;
            let view_enc = MenuItem::with_id(
                app,
                "view-encrypted",
                "Encrypted",
                true,
                Some("CmdOrCtrl+2"),
            )?;
            let view_side = MenuItem::with_id(
                app,
                "view-side",
                "Side by Side",
                true,
                Some("CmdOrCtrl+3"),
            )?;
            let view_reveal = MenuItem::with_id(
                app,
                "view-reveal",
                "Reveal",
                true,
                Some("CmdOrCtrl+4"),
            )?;

            let view_menu = Submenu::with_items(
                app,
                "View",
                true,
                &[&view_plain, &view_enc, &view_side, &view_reveal],
            )?;

            let cheat_i = MenuItem::with_id(
                app,
                "help-cheat-sheet",
                "Cipher Cheat Sheet…",
                true,
                Some("CmdOrCtrl+/"),
            )?;
            let help_menu = Submenu::with_items(app, "Help", true, &[&cheat_i])?;

            let menu =
                Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &help_menu])?;
            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            let _ = app.emit("menu-action", id);
        })
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
