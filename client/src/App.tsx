import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages';
import ListMemberPage from './pages/member';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/member" element={<ListMemberPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
