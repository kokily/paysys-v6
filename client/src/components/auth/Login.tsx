import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { LoginTemplate } from './LoginTemplate';
import { LoginTitle } from './LoginTitle';
import useUserStore from '../../libs/stores/user';

export function Login() {
  const { user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/member');
    }
  }, [user]);

  return (
    <LoginTemplate>
      <LoginTitle />
      <LoginForm />
    </LoginTemplate>
  );
}
