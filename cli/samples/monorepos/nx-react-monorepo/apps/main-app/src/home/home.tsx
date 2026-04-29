import { Link } from 'react-router-dom';
import styles from './home.module.css';

import { H1 } from "@nx-react-monorepo/ds";

/* eslint-disable-next-line */
export interface HomeProps {}

export function Home(props: HomeProps) {
  return (
    <div className={styles['container']}>
      <H1>Welcome to Home!</H1>
      <Link to="/page-one">Go to Page One</Link>
    </div>
  );
}

export default Home;
