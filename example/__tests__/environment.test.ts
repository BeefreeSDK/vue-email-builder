import { describe, it, expect } from 'vitest'
import { environment, createEnvironment } from '../environment'

describe('environment', () => {
  it('has production boolean', () => {
    expect(typeof environment.production).toBe('boolean')
  })

  it('has emailBuilder config with required keys', () => {
    expect(environment.emailBuilder).toBeDefined()
    expect(environment.emailBuilder).toHaveProperty('clientId')
    expect(environment.emailBuilder).toHaveProperty('clientSecret')
    expect(environment.emailBuilder).toHaveProperty('userId')
    expect(environment.emailBuilder).toHaveProperty('templateUrl')
  })

  it('has pageBuilder, popupBuilder, fileManager configs with required keys', () => {
    const keys = ['clientId', 'clientSecret', 'userId', 'templateUrl']
    for (const name of ['pageBuilder', 'popupBuilder', 'fileManager']) {
      const config = environment[name as keyof typeof environment]
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
      for (const key of keys) {
        expect(config).toHaveProperty(key)
      }
    }
  })

  it('createEnvironment uses empty string and your-user-id when env vars are missing', () => {
    const env = createEnvironment({})
    expect(env.emailBuilder.clientId).toBe('')
    expect(env.emailBuilder.clientSecret).toBe('')
    expect(env.emailBuilder.userId).toBe('your-user-id')
    expect(env.pageBuilder.userId).toBe('your-user-id')
    expect(env.popupBuilder.userId).toBe('your-user-id')
    expect(env.fileManager.userId).toBe('your-user-id')
  })
})
