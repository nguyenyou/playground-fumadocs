import { Separator } from '@base-ui-components/react/separator'
import { Toggle } from '@base-ui-components/react/toggle'
import { ToggleGroup } from '@base-ui-components/react/toggle-group'
import { Fullscreen, Maximize2, Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react'
import * as React from 'react'
import DialogView from './DialogView'
import { cn } from '@/lib/utils'

type Props = {
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>
  previewIframe: React.ReactNode
  expand?: boolean
  setContainerWidth: (width: number) => void
  resetContainerWidth: () => void
}

const BUTTON_CLASSES = cn("flex size-6 items-center justify-center rounded-sm text-foreground select-none hover:bg-secondary focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-secondary data-[pressed]:bg-secondary data-[pressed]:text-foreground")

const DEVICE_TOGGLES = [
  {
    id: 'desktop',
    title: 'Desktop',
    icon: Monitor,
    onClick: 'reset' as const
  },
  {
    id: 'tablet',
    title: 'Tablet (768px)',
    icon: Tablet,
    width: 768,
    onClick: 'setWidth' as const
  },
  {
    id: 'phone',
    title: 'Phone (375px)',
    icon: Smartphone,
    width: 375,
    onClick: 'setWidth' as const
  }
]

const DIALOG_VIEWS = [
  { icon: Maximize2, isFullScreen: false },
  { icon: Fullscreen, isFullScreen: true }
]

export default function Toolbar({ 
  previewIframeRef, 
  previewIframe, 
  expand, 
  setContainerWidth, 
  resetContainerWidth 
}: Props) {
  const handleRefresh = async () => {
    // Instead of trying to access contentWindow.location.reload() which is blocked by cross-origin policy,
    // we force a refresh by temporarily clearing and then restoring the srcDoc
    const iframe = previewIframeRef.current
    if (iframe) {
      const originalSrcDoc = iframe.getAttribute('srcDoc')
      // Clear srcDoc first
      iframe.setAttribute('srcDoc', '')
      // Use a short timeout to ensure the iframe processes the empty content
      setTimeout(() => {
        if (originalSrcDoc) {
          iframe.setAttribute('srcDoc', originalSrcDoc)
        }
      }, 10)
    }
  }

  const handleDeviceToggle = (device: typeof DEVICE_TOGGLES[0]) => {
    if (device.onClick === 'reset') {
      resetContainerWidth()
    } else {
      setContainerWidth(device.width!)
    }
  }

  return (
    <ToggleGroup defaultValue={['desktop']} className="flex gap-px rounded-md border border-border p-0.5 bg-card">
      {DEVICE_TOGGLES.map((device) => {
        const IconComponent = device.icon
        return (
          <Toggle
            key={device.id}
            title={device.title}
            aria-label={device.title}
            value={device.id}
            className={BUTTON_CLASSES}
            onClick={() => handleDeviceToggle(device)}
          >
            <IconComponent className="size-4" />
          </Toggle>
        )
      })}
      
      <Separator orientation="vertical" className="w-px bg-border mx-0.5" />
      
      {expand && DIALOG_VIEWS.map((dialog, index) => {
        const IconComponent = dialog.icon
        return (
          <DialogView
            key={index}
            icon={<IconComponent className="w-4 h-4" />}
            previewIframe={previewIframe}
            previewIframeRef={previewIframeRef}
            isFullScreen={dialog.isFullScreen}
          />
        )
      })}
      
      <button
        title="Refresh"
        aria-label="Refresh"
        onClick={handleRefresh}
        className={cn(BUTTON_CLASSES, "disabled:opacity-50 disabled:cursor-not-allowed transition-opacity")}
      >
        <RotateCw className="size-4 transition-transform" />
      </button>
    </ToggleGroup>
  )
}
