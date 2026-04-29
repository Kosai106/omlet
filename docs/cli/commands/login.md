# login

The `login` command authenticates the CLI and tells it where to upload scan results.

Set `OMLET_BASE_URL` to point to your Omlet instance before logging in:

```sh
OMLET_BASE_URL=http://localhost:3001 npx @omlet/cli login
```

The CLI opens a browser tab for authentication against the configured instance.

## Options

### `--print-token`

Generates an access token, useful for automating CLI runs in CI/CD.

```sh
npx @omlet/cli login --print-token
```

```sh
yarn dlx @omlet/cli login --print-token
```

```sh
pnpm dlx @omlet/cli login --print-token
```

Once the token is printed, set it to an environment variable named `OMLET_TOKEN`. Omlet CLI will use this variable automatically.

---

← [`analyze`](./analyze.md)
