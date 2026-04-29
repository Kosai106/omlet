import { PropsWithChildren } from 'react';

/* eslint-disable-next-line */
export interface ButtonProps {}

export function Button(props: PropsWithChildren<ButtonProps>) {
  return (
    <button>{props.children}</button>
  );
}

export default Button;
