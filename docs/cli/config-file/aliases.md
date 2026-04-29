# Mapping aliases

> **Note**
>
> Make sure to create the `.omletrc` file in the root directory of your repository before getting started.

If you have aliases set up in a `tsconfig` file or a bundler such as Webpack, Vite, or Babel, Omlet may have trouble resolving import paths from those aliases out of the box. Omlet can resolve them once you define the aliases in the config file.

If you already have a `tsconfig` file, point to it using the `tsconfigPath` field:

```json
// .omletrc
{
  ...
  "tsconfigPath": "tsconfig.frontend.json"
}
```

If you have aliases configured in a bundler, define the mapping between aliases and paths in the `aliases` field:

```json
// .omletrc
{
  ...
  "aliases": {
    "@components/*": ["src/components/*"],
    "@icons": ["src/icons/index.tsx"]
  }
}
```

If your project is a monorepo with multiple packages, define package-specific `aliases` using the `workspaces` field:

```json
// .omletrc
{
  "workspaces": {
    "@acme/design-system": {
      "aliases": {
        "@components/*": ["src/components/*"],
        "@icons": ["src/icons/index.tsx"]
      }
    }
  }
}
```

See the [config file reference](./README.md) for the full `aliases` property description.

---

← [Exports](./exports.md) · [Excluding files](./excluding-files.md) →
