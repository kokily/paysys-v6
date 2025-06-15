import type { KeyboardEvent, SyntheticEvent } from 'react';
import styled from 'styled-components';
import { LoginInput } from './LoginInput';
import { LoginButton } from './LoginButton';
import useAuthStore from '../../libs/stores/auth';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { loginAPI } from '../../libs/api/auth';
import useUserStore from '../../libs/stores/user';

const Container = styled.div`
  background: white;
  padding: 2rem;
  height: auto;
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 30px;
`;

const Label = styled.label`
  position: absolute;
  color: #212529;
  top: 12px;
  left: 0;
  transition: 0.2s ease all;
`;

const Bar = styled.span`
  position: relative;
  display: block;
  width: 100%;

  &:before {
    content: '';
    position: absolute;
    background: ${({ theme }) => theme.colors.member};
    height: 3px;
    left: 50%;
    right: 50%;
    bottom: 0;
    transition: left 0.2s ease-out, right 0.2s ease-out;
  }
`;

export function LoginForm() {
  const { username, password } = useAuthStore();
  const setUser = useUserStore((state) => state.setUser);
  const loginMutate = useMutation({ mutationFn: loginAPI });

  const onLogin = async (e: SyntheticEvent) => {
    e.preventDefault();

    if ([username, password].includes('')) {
      toast.warning('빈 칸 없이 입력해 주세요');
      return;
    }

    try {
      await loginMutate.mutateAsync(
        { username, password },
        {
          onSuccess: (data) => {
            setUser(data);
            toast.success(`${data.username}님 어서오세요!`);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    } catch (error) {
      console.error('Login Form Error', error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('알 수 없는 에러 발생!');
      }
    }
  };

  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onLogin(e);
    }
  };

  return (
    <Container>
      <InputGroup>
        <LoginInput type="text" name="username" />
        <Bar className="bar" />
        <Label>사용자 이름</Label>
      </InputGroup>
      <InputGroup>
        <LoginInput type="password" name="password" onKeyPress={onKeyPress} />
        <Bar className="bar" />
        <Label>비밀번호</Label>
      </InputGroup>

      <LoginButton text="로그인" onClick={onLogin} />
    </Container>
  );
}
