import PackBMain from "local-pack-b";
import { Button } from "local-pack-b/component";
import AliasInput from "alias-comps/input";
import PackBTitle from "local-pack-b/title";

export function Applet() {
  return <AliasInput></AliasInput>;
}

export function App() {
  return (
    <>
      <AliasInput/>
      <PackBTitle/>
      <PackBMain/>
      <Button/>
    </>
  );
};
