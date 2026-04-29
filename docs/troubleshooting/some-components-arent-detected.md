# Some components aren't detected

Double-check that your input parameters aren't accidentally filtering out file extensions used to define your components. For instance, if you set an input parameter like `-i '**/*.{tsx,jsx}'`, you might be skipping `.ts` or `.js` files where components are defined.

---

← [Debugging CLI issues](./debugging-cli-issues.md) · [API failed or timeout](./api-failed-or-timeout.md) →
