package com.qiplat.sweeteditor.core.visual;

import com.google.gson.annotations.SerializedName;

/**
 * Scrollbar rectangle geometry (track/thumb).
 */
public class ScrollbarRect {
    /** Top-left corner of rectangle. */
    @SerializedName("origin")
    public PointF origin;

    /** Rectangle width. */
    @SerializedName("width")
    public float width;

    /** Rectangle height. */
    @SerializedName("height")
    public float height;
}
