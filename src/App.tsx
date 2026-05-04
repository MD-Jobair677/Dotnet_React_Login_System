import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './Pages/Auth/LoginPage/Login';
import DashboardPage from './Pages/DashboardPage/DashboardPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
