import BeeTypesInstance from '@beefree.io/sdk'
import Builder from './components/Builder.vue'
import { useBuilder } from './composables/useBuilder'

export type * from '@beefree.io/sdk/dist/types/bee'
export { Builder, useBuilder, BeeTypesInstance }
export type { BuilderCallbacks, BuilderProps, BuilderPropsWithCallbacks, UseBuilder } from './types'

export { DEFAULT_CONTAINER, SDK_LOADER_URL } from './constants'

// Re-export runtime values from SDK to ensure they're available in ESM bundle
export {
  StageModeOptions,
  StageDisplayOptions,
  SidebarTabs,
  ExecCommands,
  LoadWorkspaceOptions,
  BeePluginErrorCodes,
  OnInfoDetailHandle,
  ModuleTypes,
  ModuleDescriptorNames,
  ModuleDescriptorOrderNames,
  RowLayoutType,
  EngageHandle,
  OnCommentChangeEnum,
  WorkspaceStage,
  ContentCodes,
  ActionCodes,
  EventCodes,
  BeePluginRoles,
  TokenStatus,
  PREVIEW_CONTROL,
} from '@beefree.io/sdk/dist/types/bee'
