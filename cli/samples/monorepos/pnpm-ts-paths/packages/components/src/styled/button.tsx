/* eslint-disable no-alert */
import { meaningOfLife } from "@nighttrax/foo";
import React from "react";

export const StyledButton = () => (
  <button
    type="button"
    onClick={() => alert(`the meaning if life is ${meaningOfLife}`)}
  >
    Click me
  </button>
);
