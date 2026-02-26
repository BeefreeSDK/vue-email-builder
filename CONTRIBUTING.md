# Contributing to @beefree.io/vue-email-builder

First off, thank you for considering contributing to `@beefree.io/vue-email-builder`!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Style](#code-style)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub ([BeefreeSDK/vue-email-builder](https://github.com/BeefreeSDK/vue-email-builder))
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vue-email-builder.git
   cd vue-email-builder
   ```
3. **Install dependencies** (Node version in `.nvmrc`):
   ```bash
   yarn install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Process

### Project Structure

- `src/` — The published library (components, composables, types)
- `example/` — Demo application (not published)

### Running the Demo App

```bash
cp ./example/.env.sample ./example/.env
# Fill in your Beefree credentials in ./example/.env
yarn start
```

### Building the Library

```bash
yarn build
```

### Running Tests

```bash
# Watch mode
yarn test

# Single run (CI)
yarn test:ci

# Library with coverage
yarn coverage

# Example app tests
yarn test:example

# Example app with coverage
yarn coverage:example
```

### Linting

```bash
yarn lint
```

Code style is enforced by ESLint (see `eslint.config.mjs`). Commitlint enforces conventional commit messages on commit.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```bash
feat(builder): add support for dynamic language switching
fix(useBuilder): prevent memory leak on unmount
docs(README): update installation instructions
test(Builder): add tests for config watcher
```

### Commit Message Validation

This project uses Husky and commitlint to enforce conventional commits. Invalid commit messages will be rejected.

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `yarn test:ci`
4. **Ensure linting passes**: `yarn lint`
5. **Build the library**: `yarn build`
6. **Update CHANGELOG.md** under `[Unreleased]` section
7. **Create the PR** with a clear description of changes
8. **Link related issues** using keywords (e.g., "Fixes #123")

### PR Title Format

Follow the same convention as commits:

```
feat: add collaborative editing support
fix: resolve memory leak in Builder component
```

## Testing

### Writing Tests

- Place tests in `__tests__` directories alongside source files
- Use the `.test.ts` suffix
- Use descriptive test names
- Test both success and error cases
- Vitest globals (`describe`, `it`, `expect`, `vi`) are available without import

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = setupInput()

    // Act
    const result = performAction(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

## Code Style

### TypeScript

- Use TypeScript with `strict: true`
- Avoid `any` types when possible
- Use explicit return types for public functions

### Vue

- Use Composition API with `<script setup>` for all components
- Use `ref`, `computed`, `watch` appropriately; avoid unnecessary reactivity (e.g. use plain `let` for internal guards not used in template)
- Use `defineProps` with `withDefaults` and a TypeScript interface
- Use `defineEmits` with fully typed event names and payloads
- Use `defineExpose` when exposing the SDK instance or other refs
- Prefer Vue events (`@bb-save`, `@bb-error`) over config callbacks for new code; config callbacks are supported for React-familiar patterns

### Naming Conventions

- **Components**: PascalCase (`Builder`)
- **Composables**: camelCase with `use` prefix (`useBuilder`, `useRegistry`)
- **Files**: Match the component/composable name (e.g. `Builder.vue`, `useBuilder.ts`)
- **Events**: kebab-case with `bb-` prefix (`bb-save`, `bb-session-started`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONTAINER`)

## Questions?

Feel free to open an [issue](https://github.com/BeefreeSDK/vue-email-builder/issues) for questions or discussions!

Thank you for your contribution!
