import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedAdminRoute;
