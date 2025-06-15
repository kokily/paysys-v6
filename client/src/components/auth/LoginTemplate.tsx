import type { ReactNode } from 'react';
import styled from 'styled-components';
import { shadow } from '../../styled';

interface Props {
  children: ReactNode;
}

const LoginContainer = styled.div`
  position: absolute;
  width: 320px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: 0.5s ease-out 0s 1 fadeIn;
  ${shadow(1)}
`;

export function LoginTemplate({ children }: Props) {
  return <LoginContainer>{children}</LoginContainer>;
}
