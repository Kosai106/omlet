# Tutorial: config file

In this tutorial, the design system repository has entry points in the `dist` folder, where the application projects import the published components. This causes duplicate components to appear in Omlet — one set from `src` and another from `dist`.

## Acme design system

The `package.json` of the design system repository has `main` set to `dist/index.js`:

```json
{
  "name": "acme-design",
  "version": "1.0.0",
  "description": "Acme design system",
  "main": "dist/index.js",
  "scripts": {
    "build": "npm run clean && webpack --mode production",
    "clean": "rm -rf dist"
  },
  ...
}
```

`src/index.js` exports the `Button` and `DatePicker` components:

```javascript
// src/index.js
export * from "./button";
export * from "./date-picker";
```

`src/button/button.jsx` defines the `Button` component:

```jsx
// src/button/button.jsx
import react from "react";
export const Button = ({ onClick, children }) => {
  return (
    <button
      style={{ border: "none", backgroundColor: "#f0f0f0" }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

`src/button/index.js` re-exports it:

```javascript
// src/button/index.js
export { Button } from "./button";
```

`src/date-picker/date-picker.jsx` defines `DatePicker`:

```jsx
// src/date-picker/date-picker.jsx
import react from "react";
import { Button } from "@/button";

export const DatePicker = ({ onClick, children }) => {
  return <Button onClick={onClick}>📅{children}</Button>;
};
```

`src/date-picker/index.js` re-exports it:

```javascript
// src/date-picker/index.js
export { DatePicker } from "./date-picker";
```

## Imports from application packages

If application projects import the design system component with statements like:

```javascript
import { DatePicker } from "acme-design/dist/date-picker";
import { Button } from "acme-design";
```

The CLI detects these usages as external while scanning the application projects, and you'll get duplicate components for `Button` and `DatePicker`. The components in `src` will have 0 usages because the imports resolve to the published components in `dist` instead of the actual sources in `src`.

## Config file

### Exports configuration

To help the CLI resolve the correct entry points, create a `.omletrc` file in the root of the design system repository and define the `exports` configuration:

```json
// .omletrc
{
  "$schema": "https://json.schemastore.org/omletrc.json",
  "exports": {
    "dist/*": "src/*",
    ".": "src/index.js"
  }
}
```

To prevent the CLI from scanning the `dist` folder, add its glob pattern to the `ignore` property:

```json
// .omletrc
{
  "$schema": "https://json.schemastore.org/omletrc.json",
  "exports": {
    "dist/*": "src/*",
    ".": "src/index.js"
  },
  "ignore": ["dist/**"]
}
```

### Alias configuration

If your design system uses a bundler with an alias resolving any entry point that starts with `@` to the `src` folder, you'll need to map this alias too. The final config for the design system repository:

```json
// .omletrc
{
  "$schema": "https://json.schemastore.org/omletrc.json",
  "exports": {
    "dist/*": "src/*",
    ".": "src/index.js"
  },
  "aliases": {
    "@/*": "src/*"
  },
  "ignore": ["dist/**"]
}
```

### Package-specific configuration for monorepos

If the design system and application projects live in the same monorepo, the `.omletrc` file goes in the root directory of the repository, and `exports` and `aliases` are defined under the corresponding package using the `workspaces` property:

```json
// .omletrc
{
  "$schema": "https://json.schemastore.org/omletrc.json",
  "workspaces": {
    "acme-design": {
      "exports": {
        "dist/*": "src/*",
        ".": "src/index.js"
      },
      "aliases": {
        "@/*": "src/*"
      }
    },
    "acme-app": {
      "aliases": {
        "@utils": ["src/utils/index.ts"]
      }
    }
  },
  "ignore": ["dist/**"]
}
```

---

← [Excluding files](./excluding-files.md)
