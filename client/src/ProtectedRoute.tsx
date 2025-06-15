import { Navigate, Outlet } from 'react-router-dom';
import useUserStore from './libs/stores/user';

export default function ProtectedRoute() {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
