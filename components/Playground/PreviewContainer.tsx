"use client";
import * as React from "react";
import Toolbar from "./Toolbar";
import { cn } from "@/lib/utils";

const resetCursor = () => {
  document.body.style.removeProperty("cursor");
  document.body.style.removeProperty("user-select");
};

const updateCursor = (cursor: string) => {
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";
};

type Props = {
  minWidth?: number;
  minHeight?: number;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewIframe: React.ReactNode;
  expand?: boolean;
  isFullScreen?: boolean;
};
export default function PreviewContainer({
  previewIframeRef,
  previewIframe,
  minWidth = 200,
  minHeight = 200,
  expand = false,
  isFullScreen = false,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const initialWidthRef = React.useRef<number | null>(null);
  const initialHeightRef = React.useRef<number | null>(null);

  const setContainerWidth = (newWidth: number) => {
    if (initialWidthRef.current === null && containerRef.current) {
      initialWidthRef.current =
        containerRef.current.getBoundingClientRect().width;
    }
    const ele = containerRef.current;
    const initialWidth = initialWidthRef.current;
    if (ele && initialWidth) {
      const w = Math.min(Math.max(newWidth, minWidth), initialWidth);
      ele.style.width = `${w}px`;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const ele = containerRef.current;
    if (!ele) {
      return;
    }
    if (initialWidthRef.current === null) {
      initialWidthRef.current = ele.getBoundingClientRect().width;
    }

    ele.style.userSelect = "none";
    ele.style.pointerEvents = "none";

    const startX = e.clientX;
    const rect = ele.getBoundingClientRect();
    const startWidth = rect.width;

    updateCursor("ew-resize");

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      setContainerWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      ele.style.removeProperty("user-select");
      ele.style.removeProperty("pointer-events");
      resetCursor();
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const resetContainerWidth = () => {
    if (containerRef.current && initialWidthRef.current) {
      containerRef.current.style.width = `${initialWidthRef.current}px`;
    }
  };

  const setContainerHeight = (newHeight: number) => {
    if (initialHeightRef.current === null && containerRef.current) {
      initialHeightRef.current =
        containerRef.current.getBoundingClientRect().height;
    }
    const ele = containerRef.current;
    const initialHeight = initialHeightRef.current;
    if (ele && initialHeight) {
      const h = Math.min(Math.max(newHeight, minHeight), initialHeight);
      ele.style.height = `${h}px`;
    }
  };

  const handleMouseDownVertical = (e: React.MouseEvent) => {
    const ele = containerRef.current;
    if (!ele) {
      return;
    }
    if (initialHeightRef.current === null) {
      initialHeightRef.current = ele.getBoundingClientRect().height;
    }

    ele.style.userSelect = "none";
    ele.style.pointerEvents = "none";

    const startY = e.clientY;
    const rect = ele.getBoundingClientRect();
    const startHeight = rect.height;

    updateCursor("ns-resize");

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = startHeight + deltaY;
      setContainerHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      ele.style.removeProperty("user-select");
      ele.style.removeProperty("pointer-events");
      resetCursor();
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const resetContainerHeight = () => {
    if (containerRef.current && initialHeightRef.current) {
      containerRef.current.style.height = `${initialHeightRef.current}px`;
    }
  };

  return (
    <div
      className={cn(
        "w-full h-full flex relative flex-col gap-2 bg-card",
        isFullScreen ? "" : "pb-3.5 pt-2 pl-2 pr-3.5"
      )}
    >
      {isFullScreen ? null : (
        <div className="w-full flex items-center justify-center">
          <Toolbar
            resetContainerWidth={resetContainerWidth}
            setContainerWidth={setContainerWidth}
            previewIframeRef={previewIframeRef}
            previewIframe={previewIframe}
            expand={expand}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full bg-card h-full overflow-visible"
      >
        {previewIframe}
        <div
          className={cn(
            "pointer-events-auto absolute top-1/2 -mt-6 h-12 w-1.5 cursor-ew-resize rounded-full bg-slate-950/20 hover:bg-slate-950/40 dark:bg-slate-500 dark:group-data-dragging:bg-slate-300 dark:hover:bg-slate-300",
            isFullScreen ? "right-2.5" : "-right-2.5 -mt-6"
          )}
          onMouseDown={handleMouseDown}
        />
        <div
          className={cn(
            "pointer-events-auto absolute left-1/2 -ml-6 w-12 h-1.5 cursor-ns-resize rounded-full bg-slate-950/20 hover:bg-slate-950/40 dark:bg-slate-500 dark:group-data-dragging:bg-slate-300 dark:hover:bg-slate-300",
            isFullScreen ? "bottom-2.5" : "-bottom-2.5"
          )}
          onMouseDown={handleMouseDownVertical}
        />
      </div>
    </div>
  );
}
