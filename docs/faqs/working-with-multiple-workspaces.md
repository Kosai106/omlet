# Working with multiple workspaces

## Navigating multiple workspaces

Omlet automatically directs you to the workspace you created or the workspace you were invited to first.

If you are invited to multiple workspaces, you can enter a URL with a specific workspace name, such as: `http://localhost:3001/my_other_workspace`

## Uploading scans to multiple workspaces

To upload a scan to a workspace you're invited to, rather than your default workspace, you'll need to acquire the access token of this workspace from the owner account first. The account owner can print their access token by running:

```sh
npx @omlet/cli login --print-token
```

```sh
yarn dlx @omlet/cli login --print-token
```

```sh
pnpm dlx @omlet/cli login --print-token
```

Once you get the token, set it to an environment variable named `OMLET_TOKEN`. Omlet CLI will automatically use this environment variable and upload the scan to the specific workspace.

## Working with a test instance

Omlet does not provide a test instance within the same workspace. Create a separate workspace for testing purposes.

---

← [Omlet vs. React Scanner](./omlet-vs-react-scanner.md)
