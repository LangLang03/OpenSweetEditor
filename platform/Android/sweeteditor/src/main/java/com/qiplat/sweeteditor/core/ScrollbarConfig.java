package com.qiplat.sweeteditor.core;

/**
 * Scrollbar geometry configuration.
 * Used by EditorCore to pass scrollbar parameters to C++ core.
 */
public class ScrollbarConfig {
    /** Scrollbar thickness in pixels */
    public final float thickness;
    /** Minimum scrollbar thumb length in pixels */
    public final float minThumb;

    /** Default constructor with standard values */
    public ScrollbarConfig() {
        this(10.0f, 24.0f);
    }

    /** Full constructor */
    public ScrollbarConfig(float thickness, float minThumb) {
        this.thickness = thickness;
        this.minThumb = minThumb;
    }
}
