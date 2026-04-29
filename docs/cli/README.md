# Omlet CLI

The Omlet CLI scans your React codebase to detect components, props, and how they're used, then uploads the metadata to your Omlet web app for analysis.

## Before you start

- Have a running Omlet instance (see the [project README](../../README.md) for setup).
- Have your codebase available locally. If your design system and applications live in separate repositories, clone them all.

The CLI works with single repositories, monorepos, and setups where the design system and consumers live in different repos.

## Sections

- [Your first scan](./your-first-scan.md) — get started with `omlet init`
- [Set up your dashboard](./set-up-your-dashboard.md) — tag your design system components after the first scan
- [Future scans](./future-scans.md) — keep your data up to date with `omlet analyze`
- [Ensure data accuracy](./ensure-data-accuracy.md) — fix duplicate components, missing usages, and other data issues
- [Config file](./config-file/README.md) — `.omletrc` reference
- [Custom component properties](./custom-component-properties/README.md) — add custom metadata via CLI hooks
- [Set up regular scans](./set-up-regular-scans.md) — automate scans with CI
- [CLI commands](./commands/README.md) — full command reference
