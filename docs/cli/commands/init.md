# init

The `init` command takes you through a guided process to scan your repo(s) based on your setup. Supported setups include:

- A single repo containing both your application and component library
- A monorepo with multiple packages and your component library
- Multiple application repos and a separate component library repo

> **Tip**
>
> If you need to restart the `init` setup process, you can [delete scans](../../faqs/how-to-delete-scans.md) you've created.

## Options

### `-r` / `--root`

Set where Omlet CLI will run the analysis. Useful if you're running the CLI from a different directory than the project you want to scan.

By default, the project root is the current working directory. If that directory doesn't contain a `package.json`, the CLI walks up the directory hierarchy until it finds one.

The CLI prints the resolved root in the terminal:

```shell-session
Analyzing the project at <PATH>…
```

### `--log-level`

Specify the log level for the CLI. Possible values: `error`, `warn`, `info`, `debug`, `trace`.

### `-v` / `--verbose`

Default: `false`. Adds detailed log output in the CLI.

### `-h` / `--help`

`omlet init -h` prints all available options with explanations.

---

← [Commands](./README.md) · [`analyze`](./analyze.md) →
