import { Tabs } from '@base-ui-components/react/tabs'
import { Code } from './Code'
import { Lang } from './types'
import type { FilesObject } from '@/playgroundRemarkPlugin'

type Props = {
  files: FilesObject
}
type TabPanelProps = {
  value: string
  code: string
  lang: Lang
}

// Function to determine language based on file extension
const getLanguageFromExtension = (filename: string): Lang => {
  const extension = filename.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'js':
      return 'javascript'
    case 'jsx':
      return 'jsx'
    case 'ts':
      return 'ts'
    case 'tsx':
      return 'tsx'
    default:
      return 'javascript' // fallback
  }
}

// Function to extract clean filename from path
const getFilenameFromPath = (path: string): string => {
  return path.split('/').pop() || path
}

const TabPanel = ({ value, code, lang }: TabPanelProps) => {
  return (
    <Tabs.Panel className="h-40" value={value}>
      <Code code={code} lang={lang} />
    </Tabs.Panel>
  )
}

export const FileExplorer = ({ files }: Props) => {
  // Get available file paths and create file entries, filtering out hidden files
  const fileEntries = Object.entries(files).filter(([_, fileData]) => fileData?.code && !fileData?.hidden)

  // If no files, return null or empty state
  if (fileEntries.length === 0) {
    return <div className="border-x border-b border-gray-200 p-4 text-center text-gray-500">No files to display</div>
  }

  // Find the first active file, otherwise use the first available file
  const activeFileEntry = fileEntries.find(([_, fileData]) => fileData?.active)
  const defaultValue = activeFileEntry ? activeFileEntry[0] : fileEntries[0][0]

  return (
    <Tabs.Root className="border-x border-b border-gray-200 text-sm" defaultValue={defaultValue}>
      <Tabs.List className="relative z-0 flex gap-1 px-1 shadow-[inset_0_-1px] shadow-gray-200">
        {fileEntries.map(([filePath]) => {
          const filename = getFilenameFromPath(filePath)
          return (
            <Tabs.Tab
              key={filePath}
              className="flex h-8 items-center justify-center border-0 px-2 text-sm font-medium text-gray-600 outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 before:outline-blue-800 hover:text-gray-900 focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-2 data-[selected]:text-gray-900"
              value={filePath}
            >
              {filename}
            </Tabs.Tab>
          )
        })}
        <Tabs.Indicator className="absolute top-1/2 left-0 z-[-1] h-6 w-[var(--active-tab-width)] -translate-y-1/2 translate-x-[var(--active-tab-left)] rounded-sm bg-gray-100 transition-all duration-200 ease-in-out" />
      </Tabs.List>
      {fileEntries.map(([filePath, fileData]) => {
        const filename = getFilenameFromPath(filePath)
        const lang = getLanguageFromExtension(filename)
        return <TabPanel key={filePath} value={filePath} code={fileData.code} lang={lang} />
      })}
    </Tabs.Root>
  )
}
