# Future scans

If you've made changes to repositories you previously scanned, or want to add new repositories to your analysis, scan them with the `analyze` command:

```sh
npx @omlet/cli analyze
```

```sh
yarn dlx @omlet/cli analyze
```

```sh
pnpm dlx @omlet/cli analyze
```

Omlet automatically detects previously scanned components and updates them as needed. It also matches components defined in one repo against usages in another.

## Common questions about CLI scans

### What happens to previous scans?

Omlet keeps your adoption charts up to date by tracking component changes across your projects. Removed components? No problem — usage numbers adjust automatically.

Historical charts benefit from previous scans. You'll continue to have snapshot data from a specific date so you can see how your design system evolves.

### How often should we scan the codebase?

There's no limit on how often you scan. Scan whenever there are meaningful changes to your projects or the design system.

### Should we scan everything at once?

Not necessarily. You can scan additional repositories any time. Omlet matches the relationships between recently and previously scanned components.

## Next steps

Read [Ensure data accuracy](./ensure-data-accuracy.md) and configure the [config file](./config-file/README.md) to make sure your scans produce accurate component data.

Once you're happy with the results, [set up regular scans](./set-up-regular-scans.md) to run Omlet as part of your build process or on a schedule.

---

← [Set up your dashboard](./set-up-your-dashboard.md) · [Ensure data accuracy](./ensure-data-accuracy.md) →
