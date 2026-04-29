import React from "react";
import { StyledButton } from "@nighttrax/styled-components";
import { PageComponent } from "@nighttrax/page-components";
import { meaningOfLife, FooComponent } from "@nighttrax/foo";
import { BarComponent } from "@nighttrax/bar";
import { useTest } from "@hooks/test";

export const App = () => {
  useTest();

  return (
    <FooComponent>
      <BarComponent/>
      {meaningOfLife}
      <StyledButton />
      <PageComponent/>
    </FooComponent>
  );
};
