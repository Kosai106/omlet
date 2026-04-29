# Config file

The config file lets you customize the scanning process. Use `include` and `ignore` to designate which directories to scan, and `exports` and `aliases` to help the CLI resolve the correct entry points and recognize aliases for accurate data.

## Locating the config file

The CLI configuration can be placed in any of the following:

- An `omlet` property in `package.json`
- An `.omletrc` file in JSON or YAML format in the root directory of your repository
- An `.omletrc.json`, `.omletrc.yaml`, `.omletrc.yml`, or `.omletrc.js` file in the root directory

You can also specify a custom configuration file name and location using the `--config` option:

```sh
npx @omlet/cli analyze --config './path/file'
```

```sh
yarn dlx @omlet/cli analyze --config './path/file'
```

```sh
pnpm dlx @omlet/cli analyze --config './path/file'
```

> **Tip**
>
> Auto-completion and error highlighting are available for the CLI configuration in editors like JetBrains and VS Code. Add Omlet's [schema](https://json.schemastore.org/omletrc.json) to your config file (requires CLI version 1.7.0 or above):
>
> ```json
> // .omletrc
> {
>     "$schema": "https://json.schemastore.org/omletrc.json",
>     "exports": {
>         ...
>     }
> }
> ```

## Properties

<details>

<summary>include</summary>

Specifies an array of filenames or glob patterns to include in the scan.

```json
// .omletrc
{
  "include": string[]
}
```

The paths and patterns are resolved relative to the root project path, where the `-r` parameter points to — or to the current working directory if `-r` is not provided.

```json
// .omletrc
{
  "include": ["glob/one", "glob/two"]
}
```

See [Excluding components and files](./excluding-files.md) for more.

</details>

<details>

<summary>ignore</summary>

Specifies an array of filenames or glob patterns that should be excluded from the scan.

```json
// .omletrc
{
    "ignore": string[]
}
```

Like `include`, these are resolved relative to the root project path.

```json
// .omletrc
{
  "ignore": ["**/test_folder/**", "**/another_test_folder/**"]
}
```

See [Excluding components and files](./excluding-files.md) for more.

</details>

<details>

<summary>tsconfigPath</summary>

A string that specifies the path to your tsconfig file.

```json
// .omletrc
{
  "tsconfigPath": "tsconfig.frontend.json"
}
```

</details>

<details>

<summary>exports</summary>

The `exports` property tells the CLI about the corresponding entry points of a package in the source code. This is required to resolve imports from external dependencies.

```json
// .omletrc
"exports": {
    [name: string]: string
}
```

The Omlet CLI follows the same format and convention as Node.js for the exports configuration — except for conditional exports. The main entry point, `import { … } "@acme/design-system"`, is designated with `"."`.

The `exports` property should be an object of key-value pairs. The key represents the package export, and the value should be a string specifying the location of the corresponding source module.

```json
// .omletrc
{
  "exports": {
    ".": "src/index.ts"
  }
}
```

See [Exports configuration](./exports.md) for more.

</details>

<details>

<summary>aliases</summary>

The `aliases` field lets you define custom alias configurations used by bundlers such as Webpack, Vite, or Babel. If you have a custom alias setup for your bundler, configure it for Omlet too.

```json
// .omletrc
{
    "aliases": {
        [name: string]: string[]
    }
}
```

The `aliases` property is an object of key-value pairs. The key represents the alias used in the codebase, and the value should be an array of strings specifying the location(s) of the corresponding file(s).

```json
// .omletrc
{
  "aliases": {
    "@utils": ["./src/utils/index.ts"],
    "@components/*": [
      "./src/components/*/index.ts",
      "./src/legacy-components/*/index.ts"
    ]
  }
}
```

This structure is adopted from the `paths` property in `tsconfig`. See the [tsconfig documentation on paths](https://www.typescriptlang.org/tsconfig#paths) for in-depth information.

See [Mapping aliases](./aliases.md) for more.

</details>

<details>

<summary>workspaces</summary>

An object that defines package-specific configurations for `exports` and `aliases`.

```json
// .omletrc
"workspaces": {
  [packageName: string]: {
    "aliases": {
      [name: string]: string[]
    }
  }
}
```

If your project is a monorepo with multiple packages, use `workspaces` for package-specific configuration:

```json
// .omletrc
{
  "workspaces": {
    "@acme/design-system": {
      "exports": {
        ".": "./src/index.ts"
      },
      "aliases": {}
    },
    "@acme/components": {
      "aliases": {
        "@utils": ["./src/utils/index.ts"]
      }
    }
  }
}
```

Paths and patterns in package-specific configurations are resolved relative to the root of the corresponding package. For example, if `@acme/components` is located under `packages/components`, the pattern for the `@utils` alias resolves to `packages/components/src/utils/index.ts`.

</details>

> **Note**
>
> `include`, `ignore`, and `tsconfigPath` can be set via either command-line argument or the configuration file. If a property is provided as a command-line argument, the corresponding value in the configuration file is ignored. A default value is used if the property is not set in either place.

## Next steps

Common use cases for the config file:

- [Exports configuration](./exports.md)
- [Mapping aliases](./aliases.md)
- [Excluding components and files](./excluding-files.md)
- [Tutorial: config file](./tutorial.md)

> **Issues with your component data?**
>
> If your component data in Omlet looks inaccurate, you might need to set `exports` and/or `aliases`. See [Ensure data accuracy](../ensure-data-accuracy.md).

---

[Exports](./exports.md) →
