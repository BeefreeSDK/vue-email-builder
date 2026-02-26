interface BuilderConfig {
  clientId: string
  clientSecret: string
  userId: string
  sampleTemplateUrl: string
  blankTemplateUrl: string
}

interface Environment {
  production: boolean
  emailBuilder: BuilderConfig
  pageBuilder: BuilderConfig
  popupBuilder: BuilderConfig
  fileManager: BuilderConfig
}

type EnvLike = { [key: string]: string | undefined }

export function createEnvironment(env: EnvLike = import.meta.env): Environment {
  return {
    production: false,
    emailBuilder: {
      clientId: env.VITE_EMAIL_BUILDER_CLIENT_ID ?? '',
      clientSecret: env.VITE_EMAIL_BUILDER_CLIENT_SECRET ?? '',
      userId: env.VITE_EMAIL_BUILDER_USER_ID ?? 'your-user-id',
      sampleTemplateUrl:
        env.VITE_EMAIL_TEMPLATE_URL ?? 'https://rsrc.getbee.io/api/templates/m-bee',
      blankTemplateUrl: '/templates/blank-template.json',
    },
    pageBuilder: {
      clientId: env.VITE_PAGE_BUILDER_CLIENT_ID ?? '',
      clientSecret: env.VITE_PAGE_BUILDER_CLIENT_SECRET ?? '',
      userId: env.VITE_PAGE_BUILDER_USER_ID ?? 'your-user-id',
      sampleTemplateUrl:
        env.VITE_PAGE_TEMPLATE_URL ?? 'https://rsrc.getbee.io/api/templates/m-bee-page',
      blankTemplateUrl: '/templates/blank-template.json',
    },
    popupBuilder: {
      clientId: env.VITE_POPUP_BUILDER_CLIENT_ID ?? '',
      clientSecret: env.VITE_POPUP_BUILDER_CLIENT_SECRET ?? '',
      userId: env.VITE_POPUP_BUILDER_USER_ID ?? 'your-user-id',
      sampleTemplateUrl:
        env.VITE_POPUP_TEMPLATE_URL ?? 'https://rsrc.getbee.io/api/templates/m-bee-popup',
      blankTemplateUrl: '/templates/blank-template.json',
    },
    fileManager: {
      clientId: env.VITE_FILE_MANAGER_CLIENT_ID ?? '',
      clientSecret: env.VITE_FILE_MANAGER_CLIENT_SECRET ?? '',
      userId: env.VITE_FILE_MANAGER_USER_ID ?? 'your-user-id',
      sampleTemplateUrl: '',
      blankTemplateUrl: '/templates/blank-template.json',
    },
  }
}

export const environment = createEnvironment()
