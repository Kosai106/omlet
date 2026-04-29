import styles from './page-one.module.css';

import { Button } from "@nx-react-monorepo/ds";
import { H1 } from "@nx-react-monorepo/ds";

/* eslint-disable-next-line */
export interface PageOneProps {}

export function PageOne(props: PageOneProps) {
  return (
    <div className={styles['container']}>
      <H1>Welcome to PageOne!</H1>
      <Button>Congratulations!</Button>
    </div>
  );
}

export default PageOne;
