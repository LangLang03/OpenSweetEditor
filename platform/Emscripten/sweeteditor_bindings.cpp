#ifdef __EMSCRIPTEN__

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <emscripten/em_asm.h>
#include <cstdint>
#include <cstring>
#include <vector>
#include <string>

using namespace emscripten;

typedef char16_t U16Char;

struct TextMeasurerCallbacks {
    emscripten::val measureTextWidth;
    emscripten::val measureInlayHintWidth;
    emscripten::val measureIconWidth;
    emscripten::val getFontMetrics;
};

static TextMeasurerCallbacks g_text_measurer;

extern "C" {
    intptr_t create_document_from_utf16(const U16Char* text);
    intptr_t create_document_from_file(const char* path);
    void free_document(intptr_t document_handle);
    const char* get_document_text(intptr_t document_handle);
    size_t get_document_line_count(intptr_t document_handle);
    const U16Char* get_document_line_text(intptr_t document_handle, size_t line);
    
    intptr_t create_editor(void* measurer, const uint8_t* options_data, size_t options_size);
    void free_editor(intptr_t editor_handle);
    void set_editor_document(intptr_t editor_handle, intptr_t document_handle);
    
    void set_editor_viewport(intptr_t editor_handle, int16_t width, int16_t height);
    void editor_on_font_metrics_changed(intptr_t editor_handle);
    void editor_set_fold_arrow_mode(intptr_t editor_handle, int mode);
    void editor_set_wrap_mode(intptr_t editor_handle, int mode);
    void editor_set_scale(intptr_t editor_handle, float scale);
    void editor_set_line_spacing(intptr_t editor_handle, float add, float mult);
    void editor_set_content_start_padding(intptr_t editor_handle, float padding);
    void editor_set_show_split_line(intptr_t editor_handle, int show);
    void editor_set_current_line_render_mode(intptr_t editor_handle, int mode);
    
    const uint8_t* build_editor_render_model(intptr_t editor_handle, size_t* out_size);
    const uint8_t* get_layout_metrics(intptr_t editor_handle, size_t* out_size);
    
    const uint8_t* handle_editor_gesture_event(intptr_t editor_handle, uint8_t type, uint8_t pointer_count, float* points, size_t* out_size);
    const uint8_t* handle_editor_gesture_event_ex(intptr_t editor_handle, uint8_t type, uint8_t pointer_count, float* points,
        uint8_t modifiers, float wheel_delta_x, float wheel_delta_y, float direct_scale, size_t* out_size);
    const uint8_t* editor_tick_edge_scroll(intptr_t editor_handle, size_t* out_size);
    const uint8_t* handle_editor_key_event(intptr_t editor_handle, uint16_t key_code, const char* text, uint8_t modifiers, size_t* out_size);
    
    const uint8_t* editor_insert_text(intptr_t editor_handle, const char* text, size_t* out_size);
    const uint8_t* editor_replace_text(intptr_t editor_handle, size_t start_line, size_t start_column, size_t end_line, size_t end_column, const char* text, size_t* out_size);
    const uint8_t* editor_delete_text(intptr_t editor_handle, size_t start_line, size_t start_column, size_t end_line, size_t end_column, size_t* out_size);
    const uint8_t* editor_backspace(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_delete_forward(intptr_t editor_handle, size_t* out_size);
    
    const uint8_t* editor_move_line_up(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_move_line_down(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_copy_line_up(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_copy_line_down(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_delete_line(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_insert_line_above(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_insert_line_below(intptr_t editor_handle, size_t* out_size);
    
    const uint8_t* editor_undo(intptr_t editor_handle, size_t* out_size);
    const uint8_t* editor_redo(intptr_t editor_handle, size_t* out_size);
    int editor_can_undo(intptr_t editor_handle);
    int editor_can_redo(intptr_t editor_handle);
    
    void editor_set_cursor_position(intptr_t editor_handle, size_t line, size_t column);
    void editor_get_cursor_position(intptr_t editor_handle, size_t* out_line, size_t* out_column);
    void editor_select_all(intptr_t editor_handle);
    void editor_set_selection(intptr_t editor_handle, size_t start_line, size_t start_column, size_t end_line, size_t end_column);
    int editor_get_selection(intptr_t editor_handle, size_t* out_start_line, size_t* out_start_column, size_t* out_end_line, size_t* out_end_column);
    const char* editor_get_selected_text(intptr_t editor_handle);
    void editor_get_word_range_at_cursor(intptr_t editor_handle, size_t* out_start_line, size_t* out_start_column, size_t* out_end_line, size_t* out_end_column);
    const char* editor_get_word_at_cursor(intptr_t editor_handle);
    
    void editor_move_cursor_left(intptr_t editor_handle, int extend_selection);
    void editor_move_cursor_right(intptr_t editor_handle, int extend_selection);
    void editor_move_cursor_up(intptr_t editor_handle, int extend_selection);
    void editor_move_cursor_down(intptr_t editor_handle, int extend_selection);
    void editor_move_cursor_to_line_start(intptr_t editor_handle, int extend_selection);
    void editor_move_cursor_to_line_end(intptr_t editor_handle, int extend_selection);
    
    void editor_composition_start(intptr_t editor_handle);
    void editor_composition_update(intptr_t editor_handle, const char* text);
    const uint8_t* editor_composition_end(intptr_t editor_handle, const char* committed_text, size_t* out_size);
    void editor_composition_cancel(intptr_t editor_handle);
    int editor_is_composing(intptr_t editor_handle);
    void editor_set_composition_enabled(intptr_t editor_handle, int enabled);
    int editor_is_composition_enabled(intptr_t editor_handle);
    
    void editor_set_read_only(intptr_t editor_handle, int read_only);
    int editor_is_read_only(intptr_t editor_handle);
    
    void editor_set_auto_indent_mode(intptr_t editor_handle, int mode);
    int editor_get_auto_indent_mode(intptr_t editor_handle);
    
    void editor_set_handle_config(intptr_t editor_handle,
        float start_left, float start_top, float start_right, float start_bottom,
        float end_left, float end_top, float end_right, float end_bottom);
    
    void editor_set_scrollbar_config(intptr_t editor_handle,
        float thickness, float min_thumb, float thumb_hit_padding,
        int mode, int thumb_draggable, int track_tap_mode,
        int fade_delay_ms, int fade_duration_ms);
    
    void editor_get_position_rect(intptr_t editor_handle, size_t line, size_t column, float* out_x, float* out_y, float* out_height);
    void editor_get_cursor_rect(intptr_t editor_handle, float* out_x, float* out_y, float* out_height);
    
    void editor_scroll_to_line(intptr_t editor_handle, size_t line, uint8_t behavior);
    void editor_goto_position(intptr_t editor_handle, size_t line, size_t column);
    void editor_set_scroll(intptr_t editor_handle, float scroll_x, float scroll_y);
    const uint8_t* editor_get_scroll_metrics(intptr_t editor_handle, size_t* out_size);
    
    void editor_register_text_style(intptr_t editor_handle, uint32_t style_id, int32_t color, int32_t background_color, int32_t font_style);
    void editor_set_line_spans(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_batch_line_spans(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_clear_line_spans(intptr_t editor_handle, size_t line, uint8_t layer);
    void editor_clear_highlights_layer(intptr_t editor_handle, uint8_t layer);
    
    void editor_set_line_inlay_hints(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_batch_line_inlay_hints(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_line_phantom_texts(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_batch_line_phantom_texts(intptr_t editor_handle, const uint8_t* data, size_t size);
    
    void editor_set_line_gutter_icons(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_batch_line_gutter_icons(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_max_gutter_icons(intptr_t editor_handle, uint32_t count);
    void editor_clear_gutter_icons(intptr_t editor_handle);
    
    void editor_set_line_diagnostics(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_batch_line_diagnostics(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_clear_diagnostics(intptr_t editor_handle);
    
    void editor_set_indent_guides(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_bracket_guides(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_flow_guides(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_set_separator_guides(intptr_t editor_handle, const uint8_t* data, size_t size);
    void editor_clear_guides(intptr_t editor_handle);
    
    void editor_set_bracket_pairs(intptr_t editor_handle, const uint32_t* open_chars, const uint32_t* close_chars, size_t count);
    void editor_set_matched_brackets(intptr_t editor_handle, size_t open_line, size_t open_col, size_t close_line, size_t close_col);
    void editor_clear_matched_brackets(intptr_t editor_handle);
    
    void editor_set_fold_regions(intptr_t editor_handle, const uint8_t* data, size_t size);
    int editor_toggle_fold(intptr_t editor_handle, size_t line);
    int editor_fold_at(intptr_t editor_handle, size_t line);
    int editor_unfold_at(intptr_t editor_handle, size_t line);
    void editor_fold_all(intptr_t editor_handle);
    void editor_unfold_all(intptr_t editor_handle);
    int editor_is_line_visible(intptr_t editor_handle, size_t line);
    
    void editor_clear_highlights(intptr_t editor_handle);
    void editor_clear_inlay_hints(intptr_t editor_handle);
    void editor_clear_phantom_texts(intptr_t editor_handle);
    void editor_clear_all_decorations(intptr_t editor_handle);
    
    const uint8_t* editor_insert_snippet(intptr_t editor_handle, const char* snippet_template, size_t* out_size);
    void editor_start_linked_editing(intptr_t editor_handle, const uint8_t* data, size_t size);
    int editor_is_in_linked_editing(intptr_t editor_handle);
    int editor_linked_editing_next(intptr_t editor_handle);
    int editor_linked_editing_prev(intptr_t editor_handle);
    void editor_cancel_linked_editing(intptr_t editor_handle);
    
    void free_u16_string(intptr_t string_ptr);
    void free_binary_data(intptr_t data_ptr);
}

static float js_measure_text_width(const U16Char* text, int32_t font_style) {
    if (g_text_measurer.measureTextWidth.isUndefined() || g_text_measurer.measureTextWidth.isNull()) {
        return 0.0f;
    }
    size_t len = 0;
    while (text[len] != 0) len++;
    std::u16string u16str(text, len);
    std::wstring wstr(u16str.begin(), u16str.end());
    std::string utf8str(wstr.begin(), wstr.end());
    return g_text_measurer.measureTextWidth(utf8str, font_style).as<float>();
}

static float js_measure_inlay_hint_width(const U16Char* text) {
    if (g_text_measurer.measureInlayHintWidth.isUndefined() || g_text_measurer.measureInlayHintWidth.isNull()) {
        return 0.0f;
    }
    size_t len = 0;
    while (text[len] != 0) len++;
    std::u16string u16str(text, len);
    std::wstring wstr(u16str.begin(), u16str.end());
    std::string utf8str(wstr.begin(), wstr.end());
    return g_text_measurer.measureInlayHintWidth(utf8str).as<float>();
}

static float js_measure_icon_width(int32_t icon_id) {
    if (g_text_measurer.measureIconWidth.isUndefined() || g_text_measurer.measureIconWidth.isNull()) {
        return 16.0f;
    }
    return g_text_measurer.measureIconWidth(icon_id).as<float>();
}

static void js_get_font_metrics(float* arr, size_t length) {
    if (g_text_measurer.getFontMetrics.isUndefined() || g_text_measurer.getFontMetrics.isNull()) {
        arr[0] = -12.0f;
        arr[1] = 4.0f;
        return;
    }
    emscripten::val result = g_text_measurer.getFontMetrics();
    if (length >= 2) {
        arr[0] = result["ascent"].as<float>();
        arr[1] = result["descent"].as<float>();
    }
}

struct TextMeasurerWrapper {
    float (*measure_text_width)(const U16Char*, int32_t);
    float (*measure_inlay_hint_width)(const U16Char*);
    float (*measure_icon_width)(int32_t);
    void (*get_font_metrics)(float*, size_t);
};

static TextMeasurerWrapper g_measurer_wrapper = {
    js_measure_text_width,
    js_measure_inlay_hint_width,
    js_measure_icon_width,
    js_get_font_metrics
};

intptr_t wasm_create_editor(emscripten::val measurer, uintptr_t options_data, size_t options_size) {
    g_text_measurer.measureTextWidth = measurer["measureTextWidth"];
    g_text_measurer.measureInlayHintWidth = measurer["measureInlayHintWidth"];
    g_text_measurer.measureIconWidth = measurer["measureIconWidth"];
    g_text_measurer.getFontMetrics = measurer["getFontMetrics"];
    
    const uint8_t* data = reinterpret_cast<const uint8_t*>(options_data);
    return create_editor(&g_measurer_wrapper, data, options_size);
}

intptr_t wasm_create_document_from_utf8(const std::string& text) {
    std::u16string u16str;
    for (char c : text) {
        u16str.push_back(static_cast<char16_t>(static_cast<unsigned char>(c)));
    }
    u16str.push_back(0);
    return create_document_from_utf16(u16str.c_str());
}

intptr_t wasm_create_document_from_file(const std::string& path) {
    return create_document_from_file(path.c_str());
}

std::string wasm_get_document_text(intptr_t document_handle) {
    const char* text = get_document_text(document_handle);
    if (!text) return "";
    std::string result(text);
    return result;
}

std::string wasm_get_document_line_text(intptr_t document_handle, size_t line) {
    const U16Char* text = get_document_line_text(document_handle, line);
    if (!text) return "";
    size_t len = 0;
    while (text[len] != 0) len++;
    std::u16string u16str(text, len);
    std::wstring wstr(u16str.begin(), u16str.end());
    return std::string(wstr.begin(), wstr.end());
}

emscripten::val wasm_build_editor_render_model(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = build_editor_render_model(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_get_layout_metrics(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = get_layout_metrics(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_handle_editor_gesture_event(intptr_t editor_handle, uint8_t type, emscripten::val points) {
    std::vector<float> points_vec;
    if (!points.isUndefined() && !points.isNull()) {
        size_t len = points["length"].as<size_t>();
        for (size_t i = 0; i < len; i++) {
            points_vec.push_back(points[i].as<float>());
        }
    }
    size_t size = 0;
    const uint8_t* data = handle_editor_gesture_event(editor_handle, type, 
        static_cast<uint8_t>(points_vec.size() / 2), 
        points_vec.empty() ? nullptr : points_vec.data(), 
        &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_handle_editor_gesture_event_ex(
    intptr_t editor_handle, uint8_t type, emscripten::val points,
    uint8_t modifiers, float wheel_delta_x, float wheel_delta_y, float direct_scale) {
    std::vector<float> points_vec;
    if (!points.isUndefined() && !points.isNull()) {
        size_t len = points["length"].as<size_t>();
        for (size_t i = 0; i < len; i++) {
            points_vec.push_back(points[i].as<float>());
        }
    }
    size_t size = 0;
    const uint8_t* data = handle_editor_gesture_event_ex(editor_handle, type, 
        static_cast<uint8_t>(points_vec.size() / 2), 
        points_vec.empty() ? nullptr : points_vec.data(),
        modifiers, wheel_delta_x, wheel_delta_y, direct_scale,
        &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_tick_edge_scroll(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_tick_edge_scroll(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_handle_editor_key_event(intptr_t editor_handle, uint16_t key_code, const std::string& text, uint8_t modifiers) {
    size_t size = 0;
    const uint8_t* data = handle_editor_key_event(editor_handle, key_code, 
        text.empty() ? nullptr : text.c_str(), modifiers, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_insert_text(intptr_t editor_handle, const std::string& text) {
    size_t size = 0;
    const uint8_t* data = editor_insert_text(editor_handle, text.c_str(), &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_replace_text(intptr_t editor_handle, size_t start_line, size_t start_column, size_t end_line, size_t end_column, const std::string& text) {
    size_t size = 0;
    const uint8_t* data = editor_replace_text(editor_handle, start_line, start_column, end_line, end_column, text.c_str(), &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_delete_text(intptr_t editor_handle, size_t start_line, size_t start_column, size_t end_line, size_t end_column) {
    size_t size = 0;
    const uint8_t* data = editor_delete_text(editor_handle, start_line, start_column, end_line, end_column, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_backspace(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_backspace(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_delete_forward(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_delete_forward(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_move_line_up(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_move_line_up(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_move_line_down(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_move_line_down(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_copy_line_up(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_copy_line_up(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_copy_line_down(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_copy_line_down(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_delete_line(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_delete_line(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_insert_line_above(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_insert_line_above(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_insert_line_below(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_insert_line_below(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_undo(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_undo(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_redo(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_redo(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

emscripten::val wasm_editor_get_cursor_position(intptr_t editor_handle) {
    size_t line = 0, column = 0;
    editor_get_cursor_position(editor_handle, &line, &column);
    emscripten::val result = emscripten::val::object();
    result.set("line", static_cast<int>(line));
    result.set("column", static_cast<int>(column));
    return result;
}

emscripten::val wasm_editor_get_selection(intptr_t editor_handle) {
    size_t start_line = 0, start_column = 0, end_line = 0, end_column = 0;
    int has_selection = editor_get_selection(editor_handle, &start_line, &start_column, &end_line, &end_column);
    emscripten::val result = emscripten::val::object();
    result.set("hasSelection", has_selection != 0);
    result.set("startLine", static_cast<int>(start_line));
    result.set("startColumn", static_cast<int>(start_column));
    result.set("endLine", static_cast<int>(end_line));
    result.set("endColumn", static_cast<int>(end_column));
    return result;
}

std::string wasm_editor_get_selected_text(intptr_t editor_handle) {
    const char* text = editor_get_selected_text(editor_handle);
    if (!text) return "";
    return std::string(text);
}

emscripten::val wasm_editor_get_word_range_at_cursor(intptr_t editor_handle) {
    size_t start_line = 0, start_column = 0, end_line = 0, end_column = 0;
    editor_get_word_range_at_cursor(editor_handle, &start_line, &start_column, &end_line, &end_column);
    emscripten::val result = emscripten::val::object();
    result.set("startLine", static_cast<int>(start_line));
    result.set("startColumn", static_cast<int>(start_column));
    result.set("endLine", static_cast<int>(end_line));
    result.set("endColumn", static_cast<int>(end_column));
    return result;
}

std::string wasm_editor_get_word_at_cursor(intptr_t editor_handle) {
    const char* text = editor_get_word_at_cursor(editor_handle);
    if (!text) return "";
    return std::string(text);
}

emscripten::val wasm_editor_composition_end(intptr_t editor_handle, const std::string& committed_text) {
    size_t size = 0;
    const uint8_t* data = editor_composition_end(editor_handle, committed_text.empty() ? nullptr : committed_text.c_str(), &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

void wasm_editor_composition_update(intptr_t editor_handle, const std::string& text) {
    editor_composition_update(editor_handle, text.c_str());
}

emscripten::val wasm_editor_get_position_rect(intptr_t editor_handle, size_t line, size_t column) {
    float x = 0, y = 0, height = 0;
    editor_get_position_rect(editor_handle, line, column, &x, &y, &height);
    emscripten::val result = emscripten::val::object();
    result.set("x", x);
    result.set("y", y);
    result.set("height", height);
    return result;
}

emscripten::val wasm_editor_get_cursor_rect(intptr_t editor_handle) {
    float x = 0, y = 0, height = 0;
    editor_get_cursor_rect(editor_handle, &x, &y, &height);
    emscripten::val result = emscripten::val::object();
    result.set("x", x);
    result.set("y", y);
    result.set("height", height);
    return result;
}

emscripten::val wasm_editor_get_scroll_metrics(intptr_t editor_handle) {
    size_t size = 0;
    const uint8_t* data = editor_get_scroll_metrics(editor_handle, &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

void wasm_editor_set_line_spans(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_line_spans(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_batch_line_spans(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_batch_line_spans(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_line_inlay_hints(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_line_inlay_hints(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_batch_line_inlay_hints(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_batch_line_inlay_hints(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_line_phantom_texts(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_line_phantom_texts(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_batch_line_phantom_texts(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_batch_line_phantom_texts(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_line_gutter_icons(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_line_gutter_icons(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_batch_line_gutter_icons(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_batch_line_gutter_icons(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_line_diagnostics(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_line_diagnostics(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_batch_line_diagnostics(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_batch_line_diagnostics(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_indent_guides(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_indent_guides(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_bracket_guides(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_bracket_guides(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_flow_guides(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_flow_guides(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_separator_guides(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_separator_guides(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

void wasm_editor_set_bracket_pairs(intptr_t editor_handle, emscripten::val open_chars, emscripten::val close_chars) {
    std::vector<uint32_t> opens, closes;
    if (!open_chars.isUndefined() && !open_chars.isNull()) {
        size_t len = open_chars["length"].as<size_t>();
        for (size_t i = 0; i < len; i++) {
            opens.push_back(open_chars[i].as<uint32_t>());
        }
    }
    if (!close_chars.isUndefined() && !close_chars.isNull()) {
        size_t len = close_chars["length"].as<size_t>();
        for (size_t i = 0; i < len; i++) {
            closes.push_back(close_chars[i].as<uint32_t>());
        }
    }
    if (opens.size() == closes.size() && !opens.empty()) {
        editor_set_bracket_pairs(editor_handle, opens.data(), closes.data(), opens.size());
    }
}

void wasm_editor_set_fold_regions(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_set_fold_regions(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

emscripten::val wasm_editor_insert_snippet(intptr_t editor_handle, const std::string& snippet_template) {
    size_t size = 0;
    const uint8_t* data = editor_insert_snippet(editor_handle, snippet_template.c_str(), &size);
    if (!data || size == 0) {
        return emscripten::val::null();
    }
    emscripten::val array = emscripten::val::global("Uint8Array").new_(size);
    for (size_t i = 0; i < size; i++) {
        array.set(i, data[i]);
    }
    free_binary_data(reinterpret_cast<intptr_t>(data));
    return array;
}

void wasm_editor_start_linked_editing(intptr_t editor_handle, uintptr_t data, size_t size) {
    editor_start_linked_editing(editor_handle, reinterpret_cast<const uint8_t*>(data), size);
}

EMSCRIPTEN_BINDINGS(sweeteditor) {
    function("createDocumentFromUtf8", &wasm_create_document_from_utf8);
    function("createDocumentFromFile", &wasm_create_document_from_file);
    function("freeDocument", &free_document);
    function("getDocumentText", &wasm_get_document_text);
    function("getDocumentLineCount", &get_document_line_count);
    function("getDocumentLineText", &wasm_get_document_line_text);
    
    function("createEditor", &wasm_create_editor);
    function("freeEditor", &free_editor);
    function("setEditorDocument", &set_editor_document);
    
    function("setEditorViewport", &set_editor_viewport);
    function("editorOnFontMetricsChanged", &editor_on_font_metrics_changed);
    function("editorSetFoldArrowMode", &editor_set_fold_arrow_mode);
    function("editorSetWrapMode", &editor_set_wrap_mode);
    function("editorSetScale", &editor_set_scale);
    function("editorSetLineSpacing", &editor_set_line_spacing);
    function("editorSetContentStartPadding", &editor_set_content_start_padding);
    function("editorSetShowSplitLine", &editor_set_show_split_line);
    function("editorSetCurrentLineRenderMode", &editor_set_current_line_render_mode);
    
    function("buildEditorRenderModel", &wasm_build_editor_render_model);
    function("getLayoutMetrics", &wasm_get_layout_metrics);
    
    function("handleEditorGestureEvent", &wasm_handle_editor_gesture_event);
    function("handleEditorGestureEventEx", &wasm_handle_editor_gesture_event_ex);
    function("editorTickEdgeScroll", &wasm_editor_tick_edge_scroll);
    function("handleEditorKeyEvent", &wasm_handle_editor_key_event);
    
    function("editorInsertText", &wasm_editor_insert_text);
    function("editorReplaceText", &wasm_editor_replace_text);
    function("editorDeleteText", &wasm_editor_delete_text);
    function("editorBackspace", &wasm_editor_backspace);
    function("editorDeleteForward", &wasm_editor_delete_forward);
    
    function("editorMoveLineUp", &wasm_editor_move_line_up);
    function("editorMoveLineDown", &wasm_editor_move_line_down);
    function("editorCopyLineUp", &wasm_editor_copy_line_up);
    function("editorCopyLineDown", &wasm_editor_copy_line_down);
    function("editorDeleteLine", &wasm_editor_delete_line);
    function("editorInsertLineAbove", &wasm_editor_insert_line_above);
    function("editorInsertLineBelow", &wasm_editor_insert_line_below);
    
    function("editorUndo", &wasm_editor_undo);
    function("editorRedo", &wasm_editor_redo);
    function("editorCanUndo", &editor_can_undo);
    function("editorCanRedo", &editor_can_redo);
    
    function("editorSetCursorPosition", &editor_set_cursor_position);
    function("editorGetCursorPosition", &wasm_editor_get_cursor_position);
    function("editorSelectAll", &editor_select_all);
    function("editorSetSelection", &editor_set_selection);
    function("editorGetSelection", &wasm_editor_get_selection);
    function("editorGetSelectedText", &wasm_editor_get_selected_text);
    function("editorGetWordRangeAtCursor", &wasm_editor_get_word_range_at_cursor);
    function("editorGetWordAtCursor", &wasm_editor_get_word_at_cursor);
    
    function("editorMoveCursorLeft", &editor_move_cursor_left);
    function("editorMoveCursorRight", &editor_move_cursor_right);
    function("editorMoveCursorUp", &editor_move_cursor_up);
    function("editorMoveCursorDown", &editor_move_cursor_down);
    function("editorMoveCursorToLineStart", &editor_move_cursor_to_line_start);
    function("editorMoveCursorToLineEnd", &editor_move_cursor_to_line_end);
    
    function("editorCompositionStart", &editor_composition_start);
    function("editorCompositionUpdate", &wasm_editor_composition_update);
    function("editorCompositionEnd", &wasm_editor_composition_end);
    function("editorCompositionCancel", &editor_composition_cancel);
    function("editorIsComposing", &editor_is_composing);
    function("editorSetCompositionEnabled", &editor_set_composition_enabled);
    function("editorIsCompositionEnabled", &editor_is_composition_enabled);
    
    function("editorSetReadOnly", &editor_set_read_only);
    function("editorIsReadOnly", &editor_is_read_only);
    
    function("editorSetAutoIndentMode", &editor_set_auto_indent_mode);
    function("editorGetAutoIndentMode", &editor_get_auto_indent_mode);
    
    function("editorSetHandleConfig", &editor_set_handle_config);
    function("editorSetScrollbarConfig", &editor_set_scrollbar_config);
    
    function("editorGetPositionRect", &wasm_editor_get_position_rect);
    function("editorGetCursorRect", &wasm_editor_get_cursor_rect);
    
    function("editorScrollToLine", &editor_scroll_to_line);
    function("editorGotoPosition", &editor_goto_position);
    function("editorSetScroll", &editor_set_scroll);
    function("editorGetScrollMetrics", &wasm_editor_get_scroll_metrics);
    
    function("editorRegisterTextStyle", &editor_register_text_style);
    function("editorSetLineSpans", &wasm_editor_set_line_spans);
    function("editorSetBatchLineSpans", &wasm_editor_set_batch_line_spans);
    function("editorClearLineSpans", &editor_clear_line_spans);
    function("editorClearHighlightsLayer", &editor_clear_highlights_layer);
    
    function("editorSetLineInlayHints", &wasm_editor_set_line_inlay_hints);
    function("editorSetBatchLineInlayHints", &wasm_editor_set_batch_line_inlay_hints);
    function("editorSetLinePhantomTexts", &wasm_editor_set_line_phantom_texts);
    function("editorSetBatchLinePhantomTexts", &wasm_editor_set_batch_line_phantom_texts);
    
    function("editorSetLineGutterIcons", &wasm_editor_set_line_gutter_icons);
    function("editorSetBatchLineGutterIcons", &wasm_editor_set_batch_line_gutter_icons);
    function("editorSetMaxGutterIcons", &editor_set_max_gutter_icons);
    function("editorClearGutterIcons", &editor_clear_gutter_icons);
    
    function("editorSetLineDiagnostics", &wasm_editor_set_line_diagnostics);
    function("editorSetBatchLineDiagnostics", &wasm_editor_set_batch_line_diagnostics);
    function("editorClearDiagnostics", &editor_clear_diagnostics);
    
    function("editorSetIndentGuides", &wasm_editor_set_indent_guides);
    function("editorSetBracketGuides", &wasm_editor_set_bracket_guides);
    function("editorSetFlowGuides", &wasm_editor_set_flow_guides);
    function("editorSetSeparatorGuides", &wasm_editor_set_separator_guides);
    function("editorClearGuides", &editor_clear_guides);
    
    function("editorSetBracketPairs", &wasm_editor_set_bracket_pairs);
    function("editorSetMatchedBrackets", &editor_set_matched_brackets);
    function("editorClearMatchedBrackets", &editor_clear_matched_brackets);
    
    function("editorSetFoldRegions", &wasm_editor_set_fold_regions);
    function("editorToggleFold", &editor_toggle_fold);
    function("editorFoldAt", &editor_fold_at);
    function("editorUnfoldAt", &editor_unfold_at);
    function("editorFoldAll", &editor_fold_all);
    function("editorUnfoldAll", &editor_unfold_all);
    function("editorIsLineVisible", &editor_is_line_visible);
    
    function("editorClearHighlights", &editor_clear_highlights);
    function("editorClearInlayHints", &editor_clear_inlay_hints);
    function("editorClearPhantomTexts", &editor_clear_phantom_texts);
    function("editorClearAllDecorations", &editor_clear_all_decorations);
    
    function("editorInsertSnippet", &wasm_editor_insert_snippet);
    function("editorStartLinkedEditing", &wasm_editor_start_linked_editing);
    function("editorIsInLinkedEditing", &editor_is_in_linked_editing);
    function("editorLinkedEditingNext", &editor_linked_editing_next);
    function("editorLinkedEditingPrev", &editor_linked_editing_prev);
    function("editorCancelLinkedEditing", &editor_cancel_linked_editing);
    
    function("freeBinaryData", &free_binary_data);
}

#endif // __EMSCRIPTEN__
