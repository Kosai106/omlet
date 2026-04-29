# API failed or timeout

If you're seeing failed API requests or timeouts, first try regenerating your access token:

```sh
npx @omlet/cli login --print-token
```

```sh
yarn dlx @omlet/cli login --print-token
```

```sh
pnpm dlx @omlet/cli login --print-token
```

This error may also happen when Omlet tries to scan a large project with many components and complex dependencies, or a large file unrelated to a component. Try narrowing down the directories and files Omlet CLI scans using the `-i` parameter.

---

← [Some components aren't detected](./some-components-arent-detected.md) · [Are you behind a proxy?](./are-you-behind-a-proxy.md) →
