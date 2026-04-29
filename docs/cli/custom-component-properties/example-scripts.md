# Other example scripts

## Test and Storybook coverage

This hook adds `hasTests` and `hasStories` properties to each component to mark components in terms of their test and Storybook coverage.

```javascript
// hook-script.js
const { promises: fs, constants: fsConstants } = require("fs");
const path = require("path");

const fileLookupCache = new Map();
async function exists(filePath) {
  const absPath = path.resolve(__dirname, filePath);
  if (fileLookupCache.has(absPath)) {
    return fileLookupCache.get(absPath);
  }
  try {
    await fs.access(absPath, fsConstants.F_OK);
    fileLookupCache.set(absPath, true);
    return true;
  } catch {
    fileLookupCache.set(absPath, false);
    return false;
  }
}

function hasTests(filePath) {
  const testFilePath = filePath.replace(/(.)(\.[jt]sx?)$/, "$1.test$2");
  return exists(testFilePath);
}

function hasStories(filePath) {
  const testFilePath = filePath.replace(/(.)(\.[jt]sx?)$/, "$1.stories$2");
  return exists(testFilePath);
}

/**
 * @type {import('@omlet/cli').CliHookModule}
 */
module.exports = {
  async afterScan(components) {
    for (const component of components) {
      component.setMetadata("hasStories", await hasStories(component.filePath));
      component.setMetadata("hasTests", await hasTests(component.filePath));
    }
  },
};
```

## Visual components

This hook marks components as visual if they render a visual HTML element (e.g. `<div>`, `<img />`) or another component marked as visual. The full HTML tag list is omitted here for brevity.

```javascript
// hook-script.js
// A set of HTML tags that are considered to be UI elements
const htmlUiTags = new Set([
  "a",
  "abbr",
  "acronym",
  "address",
  // ...
]);

/**
 * @type {import('@omlet/cli').CliHookModule}
 */
module.exports = {
  afterScan(components) {
    const visualComponents = new Set();
    let updated;
    do {
      updated = false;
      for (const component of components) {
        if (visualComponents.has(component.id)) {
          continue;
        } else if (
          component.htmlElementsUsed.some((tag) => htmlUiTags.has(tag))
        ) {
          component.setMetadata("isVisualComponent", true);
          visualComponents.add(component.id);
          updated = true;
        } else if (
          component.children.some((child) => visualComponents.has(child.id))
        ) {
          component.setMetadata("isVisualComponent", true);
          visualComponents.add(component.id);
          updated = true;
        } else {
          component.setMetadata("isVisualComponent", false);
        }
      }
    } while (updated);
  },
};
```

## Deprecated components

This hook marks components that contain a `@deprecated` comment.

```javascript
// hook-script.js
const { promises: fs, constants: fsConstants } = require("fs");
const path = require("path");

async function isDeprecated(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const deprecatedPattern = /@deprecated/;
    return deprecatedPattern.test(fileContent);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }
}

/**
 * @type {import('@omlet/cli').CliHookModule}
 */
module.exports = {
  async afterScan(components) {
    for (const component of components) {
      const deprecated = await isDeprecated(component.filePath);
      component.setMetadata("Is deprecated", deprecated);
    }
  },
};
```

---

← [Tutorial: package version](./tutorial-package-version.md)
