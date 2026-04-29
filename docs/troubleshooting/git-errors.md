# Git errors

Omlet uses Git history to designate when a component is created and updated. If your project doesn't have Git set up or no commits exist, you may encounter the following issues.

## Could not find git root

This error indicates that Git is not initialized in the repository. To resolve it:

Make sure your project contains a `.git` directory and confirm that it's sourced from a Git repository. If you manually downloaded the project as a `.zip` file, clone the repository directly from your Git instance:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
```

If you don't have Git set up, run the commands below to initialize Git for your project and add an initial commit:

```bash
git init
git add .
git commit -m "Initial commit"
```

## Could not find commit in git repo / Git util error

These errors indicate that no commit was found, or there's an issue with the Git utility. Make sure there are commits in the Git repository.

If commits exist already, make sure your project is not a shallow clone:

```bash
git pull --unshallow
```

---

← [Are you behind a proxy?](./are-you-behind-a-proxy.md)
