package com.qiplat.sweeteditor.core.keymap;

import androidx.annotation.NonNull;

import java.util.HashMap;
import java.util.Map;

/**
 * Pure data container for keyboard shortcut bindings.
 * Stores {@link KeyBinding} entries whose {@code command} field points to the target command id.
 * Platform-specific command handlers
 * are managed by subclasses (e.g. EditorKeyMap in the widget layer).
 */
public class KeyMap {

    private final Map<KeyBinding, Integer> mBindings = new HashMap<>();

    public void addBinding(@NonNull KeyBinding binding) {
        mBindings.put(binding, binding.command);
    }

    public void removeBinding(@NonNull KeyBinding binding) {
        mBindings.remove(binding);
    }

    @NonNull
    public Map<KeyBinding, Integer> getBindings() {
        return mBindings;
    }
}
