import csCZ from './cs-CZ.json'
import daDK from './da-DK.json'
import deDE from './de-DE.json'
import enUS from './en-US.json'
import esES from './es-ES.json'
import fiFI from './fi-FI.json'
import frFR from './fr-FR.json'
import huHU from './hu-HU.json'
import idID from './id-ID.json'
import itIT from './it-IT.json'
import jaJP from './ja-JP.json'
import koKR from './ko-KR.json'
import nbNO from './nb-NO.json'
import nlNL from './nl-NL.json'
import plPL from './pl-PL.json'
import ptBR from './pt-BR.json'
import roRO from './ro-RO.json'
import ruRU from './ru-RU.json'
import slSI from './sl-SI.json'
import svSE from './sv-SE.json'
import zhCN from './zh-CN.json'
import zhHK from './zh-HK.json'

const rawMessages = {
  'en-US': enUS,
  'it-IT': itIT,
  'es-ES': esES,
  'fr-FR': frFR,
  'de-DE': deDE,
  'pt-BR': ptBR,
  'id-ID': idID,
  'ja-JP': jaJP,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  'cs-CZ': csCZ,
  'nb-NO': nbNO,
  'da-DK': daDK,
  'sv-SE': svSE,
  'pl-PL': plPL,
  'hu-HU': huHU,
  'ru-RU': ruRU,
  'ko-KR': koKR,
  'nl-NL': nlNL,
  'fi-FI': fiFI,
  'ro-RO': roRO,
  'sl-SI': slSI,
} as const

export type LocaleCode = keyof typeof rawMessages
export type LocaleMessages = (typeof rawMessages)['en-US']

export const messages: Record<LocaleCode, LocaleMessages> = rawMessages

export const uiLanguages = Object.keys(messages) as LocaleCode[]
