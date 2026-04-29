import { PropsWithChildren } from "react";

/* eslint-disable-next-line */
export interface H1Props {}

export function H1(props: PropsWithChildren<H1Props>) {
  return (
    <h1>{props.children}</h1>
  );
}

export default H1;
