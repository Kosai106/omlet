# Excluding components and files

Omlet CLI ignores some files by default while scanning, including node modules, Storybook stories, and test files:

- `**/node_modules/**`
- `**/*.d.ts`
- `**/stories/**/*`
- `**/.storybook/**/*`
- `**/*.stories.{jsx,tsx,js,ts}`
- `**/*.{spec,test}.{jsx,tsx,js,ts}`
- `**/{__test__,tests}/**/*.{jsx,tsx,js,ts}`

You can define custom file names and glob patterns to exclude from scans, or limit the CLI to certain directories and patterns. There are two ways to do this.

## Option 1: Config file

Create an `.omletrc` file in the root directory of your repository. The CLI will detect it automatically and apply your configuration.

> **Note**
>
> Your config file can have alternative names and locations. See the [config file reference](./README.md).

Define the `ignore` property with an array of filenames or glob patterns to exclude:

```json
// .omletrc
{
  "ignore": ["**/test_folder/**", "**/another_test_folder/**"]
}
```

If you need to narrow where the CLI looks for components, define the `include` property with an array of filenames or glob patterns:

```json
// .omletrc
{
  "include": ["glob/one", "glob/two"]
}
```

> **Note**
>
> Paths and patterns are resolved relative to the root project path, where the `-r` parameter points to — or to the current working directory if `-r` is not provided.

## Option 2: Command-line arguments

Add the `--ignore` option to the `analyze` command:

```sh
npx @omlet/cli analyze --ignore 'glob/one'
```

```sh
yarn dlx @omlet/cli analyze --ignore 'glob/one'
```

```sh
pnpm dlx @omlet/cli analyze --ignore 'glob/one'
```

To ignore multiple directories, pass multiple glob patterns:

```sh
npx @omlet/cli analyze --ignore 'glob/one' --ignore 'glob/two'
```

```sh
yarn dlx @omlet/cli analyze --ignore 'glob/one' --ignore 'glob/two'
```

```sh
pnpm dlx @omlet/cli analyze --ignore 'glob/one' --ignore 'glob/two'
```

Similarly, use `-i` / `--include` to scan only specific components, files, or directories:

```sh
npx @omlet/cli analyze -i 'glob/one' -i 'glob/two'
```

```sh
yarn dlx @omlet/cli analyze -i 'glob/one' -i 'glob/two'
```

```sh
pnpm dlx @omlet/cli analyze -i 'glob/one' -i 'glob/two'
```

> **Note**
>
> If `ignore` or `include` is provided both as a command-line argument and in the config file, the command-line argument takes precedence and the config file value is ignored.

---

← [Aliases](./aliases.md) · [Tutorial](./tutorial.md) →
