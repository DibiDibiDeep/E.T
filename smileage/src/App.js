import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout1 from './layouts/Layout1';
import Main from './pages/Main';

function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout1/>}>
          <Route index element={<Main />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
