# OpenSweetEditor Web SDK Workspace

This workspace contains the TypeScript-based Web SDK v2.

## Packages

- `@opensweeteditor/core`
- `@opensweeteditor/widget`
- `@opensweeteditor/providers-sweetline`
- `@opensweeteditor/sdk`

## Demo

- `apps/demo` (Vite)

## Commands

```bash
pnpm install
pnpm clean
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm build:web-dist
```

`build:web-dist` outputs static files to:

- `platform/Emscripten/web`

`@opensweeteditor/sdk` package build also prepares bundled runtime assets under:

- `packages/sdk/runtime/sweeteditor.js`
- `packages/sdk/runtime/sweeteditor.wasm`
- `packages/sdk/runtime/libs/sweetline/*`
