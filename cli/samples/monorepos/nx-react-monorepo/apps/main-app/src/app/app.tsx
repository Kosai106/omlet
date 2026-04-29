import { Route, Routes } from 'react-router-dom';

import Home from '../home/home';
import { PageOne } from '@nx-react-monorepo/page-one';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/page-one" element={<PageOne />}></Route>
    </Routes>
  );
}

export default App;
