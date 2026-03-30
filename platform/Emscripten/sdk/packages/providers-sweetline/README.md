# @opensweeteditor/providers-sweetline

Optional SweetLine decoration provider package for OpenSweetEditor Web SDK v2.

## Install

```bash
npm i @opensweeteditor/providers-sweetline
```

## Usage

```ts
import { createSweetLineDecorationProvider } from "@opensweeteditor/providers-sweetline";

const provider = createSweetLineDecorationProvider({
  sweetLine,
  highlightEngine
});

editor.registerDecorationProvider(provider);
```

