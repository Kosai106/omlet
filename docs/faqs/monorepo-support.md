# Monorepo support

Omlet supports monorepos and automatically detects each package as a separate project. Here's how detection works for each package manager / build system.

<details>

<summary>npm / Yarn</summary>

Omlet looks for the workspace configuration in `package.json`, under the `workspaces` or `workspaces.packages` field.

```json
// package.json
{
  "workspaces": {
    "packages": [
      "packages/ds",
      "packages/app"
    ]
  }
}
```

```json
// package.json
{
  "workspaces": [
    "packages/ds",
    "packages/app"
  ]
}
```

```json
// package.json
{
  "workspaces": [
    "packages/*"
  ]
}
```

</details>

<details>

<summary>pnpm</summary>

Omlet looks for the workspace configuration in `pnpm-workspace.yaml`, under the `packages` field.

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/**"
  - "apps/**"
```

</details>

<details>

<summary>Lerna</summary>

Omlet looks for the workspace configuration in `lerna.json`, under the `packages` field.

```json
// lerna.json
{
  "packages": ["packages/*"]
}
```

</details>

<details>

<summary>Bolt</summary>

Omlet looks for the workspace configuration in `package.json`, under the `bolt` field.

```json
// package.json
{
  "bolt": {
    "workspaces": [
      "packages/*"
    ]
  }
}
```

</details>

<details>

<summary>Nx</summary>

Nx can be installed on top of other monorepo libraries. Omlet detects workspaces defined using another monorepo library configuration and ignores Nx — having `nx.json` in a repo doesn't mean it's treated as an Nx monorepo. Other monorepo configurations take precedence.

If Nx is used as the main monorepo library, each workspace folder contains a `project.json` file and, optionally, a `package.json` file if the workspace is publishable. Omlet searches for both `project.json` and `package.json` in the repository to figure out workspace folders. If `package.json` exists, the `name` field in `package.json` is used as the workspace name. Otherwise, the `name` field in `project.json` (or the folder name if the name field doesn't exist) is combined with the name of the root `package.json` to generate the workspace name.

Package dependency resolution is handled by utilizing `tsconfig.json` files under each workspace. Each `tsconfig.json` under a workspace extends `tsconfig.base.json` on the root folder, which contains the `paths` configuration needed for dependency resolution.

For example, with the configurations below, Omlet detects the workspaces as `@nx-monorepo/ds` and `@nx-monorepo/app`.

```json
// package.json (root)
{
  "name": "@nx-monorepo"
}
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@nx-monorepo/ds": ["path/to/ds/src/index.ts"]
    }
  }
}
```

```json
// path/to/ds/package.json
{
  "name": "@nx-monorepo/ds"
}
```

```json
// path/to/ds/project.json
{
  "name": "design-system"
}
```

```json
// path/to/ds/tsconfig.json
{
  "extends": "../../../tsconfig.base.json"
}
```

```json
// path/to/app/project.json
{
  "name": "app"
}
```

```json
// path/to/app/tsconfig.json
{
  "extends": "../../../tsconfig.base.json"
}
```

</details>

---

← [How detection works](./how-detection-works.md) · [How to delete scans](./how-to-delete-scans.md) →
