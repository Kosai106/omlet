# Set up regular scans

Once you're happy with the results, set up Omlet CLI to run as part of your build process or on a schedule. This way, you'll see usage changes over time and track new components as they're added, removed, or updated.

> **Note**
>
> Your Omlet instance must be reachable from CI. A local-only deployment (e.g. `http://localhost:3001`) won't work — host it at a URL CI runners can reach, and set `OMLET_BASE_URL` in your CI environment alongside `OMLET_TOKEN`.

To run the CLI in an automated environment, pass the Omlet access token in via an environment variable.

Generate an access token by running:

```sh
npx @omlet/cli login --print-token
```

```sh
yarn dlx @omlet/cli login --print-token
```

```sh
pnpm dlx @omlet/cli login --print-token
```

Set the access token to an environment variable named `OMLET_TOKEN`. Omlet CLI uses this variable to upload scans. Sample snippets for common CI platforms:

### GitHub Actions

```yaml
name: Omlet CLI scan

on:
  push:
    branches:
      - main

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run analyze
        run: npx @omlet/cli analyze
        env:
          OMLET_TOKEN: ${{ secrets.OMLET_TOKEN }}
          OMLET_BASE_URL: https://omlet.example.com
```

### GitLab CI/CD

```yaml
stages:
  - scan

scan:
  stage: scan
  image: node:20
  script:
    - npx @omlet/cli analyze
  only:
    - main
  except:
    - tags

cache:
  paths:
    - node_modules/

variables:
  OMLET_TOKEN: $OMLET_TOKEN
  OMLET_BASE_URL: https://omlet.example.com
```

### CircleCI

```yaml
version: 2.1

jobs:
  scan:
    docker:
      - image: cimg/node:20.0
    environment:
      OMLET_TOKEN: $OMLET_TOKEN
      OMLET_BASE_URL: https://omlet.example.com
    steps:
      - checkout
      - run:
          name: Run Omlet analysis
          command: npx @omlet/cli analyze

workflows:
  version: 2
  scan:
    jobs:
      - scan:
          filters:
            branches:
              only: main
            tags:
              ignore: /.*/
```

---

← [Ensure data accuracy](./ensure-data-accuracy.md)
