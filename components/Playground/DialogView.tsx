import * as React from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import PreviewContainer from "./PreviewContainer";
import { cn } from "@/lib/utils";

type Props = {
  previewIframe: React.ReactNode;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  isFullScreen?: boolean;
  icon: React.ReactNode;
};
export default function DialogView({
  previewIframe,
  previewIframeRef,
  isFullScreen = false,
  icon,
}: Props) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex size-6 items-center justify-center rounded-sm text-foreground select-none hover:bg-secondary focus-visible:bg-none  focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:bg-gray-100 data-[pressed]:text-gray-900">
        {icon}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed z-[100] inset-0 bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
        <Dialog.Popup
          className={cn(
            "fixed z-[100] top-1/2 left-1/2 w-screen h-screen -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card text-foreground transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
            isFullScreen
              ? ""
              : "max-w-[calc(100vw-20rem)] max-h-[calc(100vh-20rem)] p-6 outline-1 outline-border"
          )}
        >
          <PreviewContainer
            isFullScreen={isFullScreen}
            previewIframeRef={previewIframeRef}
            previewIframe={previewIframe}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
