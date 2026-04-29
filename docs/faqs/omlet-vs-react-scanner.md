# Omlet vs. React Scanner

Before Omlet, the most common way to analyze React component usage was [React Scanner](https://github.com/moroshko/react-scanner). Here's how Omlet differs.

## Component detection

### React Scanner doesn't detect components with zero usages or components used outside JSX expressions

For example, the usage of `UserProfile` and `CompanyProfile` in `Profile` is not detected by react-scanner. It instead reports the usage of a component called `Component`, which is the intermediary variable used to select the right profile component.

```jsx
function Profile({ accountType }) {
  const components = {
    userProfile: UserProfile,
    companyProfile: CompanyProfile,
  };

  const Component = components[accountType];

  return (
    <>
      ...
      <Component>...</Component>
    </>
  );
}
```

### Dependencies among components defined in the same module aren't detected

The dependency between `NamedComponentWrapped` and `ComponentUsingNamedWrappedComponent` is missing in react-scanner results.

```jsx
export function ComponentUsingNamedWrappedComponent() {
  return <NamedComponentWrapped />;
}
export function NamedComponentWrapped() {
  return <div></div>;
}
```

### Usages are reported at the file level, so dependencies of components defined in the same module aren't visible

For example:

```jsx
import { Button, Input } from "./components";

export function Footer() {
  return (
    <div>
      <Button />
    </div>
  );
}

export function Header() {
  return (
    <div>
      <h1>Hello</h1>
      <Input />
    </div>
  );
}
```

react-scanner's usage detection result will be:

- `Button` in `components/navigation.jsx`
- `Input` in `components/navigation.jsx`

Whereas Omlet will report:

- `Footer` uses `Button`
- `Header` uses `Input`

## Import resolution

### react-scanner does not follow exports to find the source component for imports

Instead, it detects names imported from modules. This causes duplicate components and incorrect usage numbers. For example, given the code below, react-scanner produces 4 separate button components since each has a distinct import name and import path combination:

- `Button` from `components/Button`
- `Button` from `components/Button/Button`
- `SameButton` from `components/Button`
- `TheButton` from `components/Button`

In react-scanner reports, each combination has a separate usage count. Omlet detects that they're actually the same component and gives the total (correct) number of usages.

```jsx
// file: components/Button/Button.jsx
export function Button() { .. }

// file: components/Button/index.jsx
import { Button } from "./Button";
export { Button };
export default Button;

// file app/pageA.jsx
import { Button } from "../components/Button";

// file app/pageB.jsx
import { Button } from "../components/Button/Button";

// file app/pageC.jsx
import SameButton from "../components/Button";

// file app/pageC.jsx
import TheButton from "../components/Button";
```

## Alias resolution

Aliased imports appear as separate components in react-scanner reports. Similar to the import-resolution issue above, this causes fragmented usage counts and duplicate entries.

```jsx
// file: frontend/src/layout/navigation/TopBar/SitePopover.tsx
import { ProfilePicture } from "lib/lemon-ui/ProfilePicture";

// file: frontend/src/lib/lemon-ui/LemonTable/columnUtils.tsx
import { ProfilePicture } from "../ProfilePicture";
```

## Missing in Omlet

- **HTML tags in JSX are not detected.** Omlet doesn't detect React element equivalents of HTML tags such as `div`, `img`, etc.
- **Instance counts.** Omlet doesn't count component instances. Instead, it reports unique parent components for each component. react-scanner reports each instance separately.

---

← [How to delete scans](./how-to-delete-scans.md) · [Working with multiple workspaces](./working-with-multiple-workspaces.md) →
