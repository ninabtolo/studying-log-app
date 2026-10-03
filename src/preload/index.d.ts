import { ElectronAPI } from '@electron-toolkit/preload'
import type { StudyLogApi } from './api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: StudyLogApi
  }
}
