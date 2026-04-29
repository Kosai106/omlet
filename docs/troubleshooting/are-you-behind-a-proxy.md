# Are you behind a proxy?

To submit analyses through proxy servers, pass proxy configuration to the CLI using the `HTTP_PROXY` environment variable.

```bash
HTTP_PROXY=http://example.com:1234 npx @omlet/cli analyze
```

```bash
HTTP_PROXY=http://example.com:1234 yarn dlx @omlet/cli analyze
```

```bash
HTTP_PROXY=http://example.com:1234 pnpm dlx @omlet/cli analyze
```

---

← [API failed or timeout](./api-failed-or-timeout.md) · [Git errors](./git-errors.md) →
