import type { TruthNewsApi } from '../../../shared/types'

declare global {
  interface Window {
    truthNews: TruthNewsApi
  }
}

export {}
