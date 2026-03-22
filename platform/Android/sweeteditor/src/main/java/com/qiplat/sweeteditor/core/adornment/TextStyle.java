package com.qiplat.sweeteditor.core.adornment;

/**
 * Immutable text style definition referenced by {@link StyleSpan#styleId}.
 * <p>
 * This style is registered into C++ via theme application and directly used in render-model runs.
 */
public final class TextStyle {
    /** Font style bit flag: normal. */
    public static final int NORMAL = 0;
    /** Font style bit flag: bold. */
    public static final int BOLD = 1; // 1 << 0
    /** Font style bit flag: italic. */
    public static final int ITALIC = 1 << 1; // 2
    /** Font style bit flag: strikethrough. */
    public static final int STRIKETHROUGH = 1 << 2; // 4

    /** Foreground color (ARGB). */
    public final int color;
    /** Background color (ARGB), 0 means transparent. */
    public final int backgroundColor;
    /** Font style bit flags ({@link #NORMAL}, {@link #BOLD}, {@link #ITALIC}, {@link #STRIKETHROUGH}). */
    public final int fontStyle;

    public TextStyle(int color, int fontStyle) {
        this(color, 0, fontStyle);
    }

    public TextStyle(int color, int backgroundColor, int fontStyle) {
        this.color = color;
        this.backgroundColor = backgroundColor;
        this.fontStyle = fontStyle;
    }
}
