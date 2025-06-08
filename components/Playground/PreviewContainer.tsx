"use client";
import * as React from "react";
import Toolbar from "./Toolbar";
import { cn } from "@/lib/utils";

const resetCursor = () => {
  document.body.style.removeProperty("cursor");
  document.body.style.removeProperty("user-select");
};

const updateCursor = () => {
  document.body.style.cursor = "ew-resize";
  document.body.style.userSelect = "none";
};

type Props = {
  minWidth?: number;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewIframe: React.ReactNode;
  expand?: boolean;
  isFullScreen?: boolean;
};
export default function PreviewContainer({
  previewIframeRef,
  previewIframe,
  minWidth = 200,
  expand = false,
  isFullScreen = false,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const initialWidthRef = React.useRef<number | null>(null);

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

    updateCursor();

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

  return (
    <div
      className={cn(
        "w-full h-full flex relative flex-col gap-2 bg-gray-100/50 ",
        isFullScreen ? "" : "pb-2 pt-2 pl-2 pr-3.5 border border-gray-200"
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
        className="relative w-full bg-white h-full overflow-visible"
      >
        {previewIframe}
        <div
          className={cn(
            "pointer-events-auto absolute top-1/2 -mt-6 h-12 w-1.5 cursor-ew-resize rounded-full bg-slate-950/20 hover:bg-slate-950/40",
            isFullScreen ? "right-2.5" : "-right-2.5 -mt-6"
          )}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}
