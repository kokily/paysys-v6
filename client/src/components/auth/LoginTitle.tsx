import styled from 'styled-components';
import { Link } from 'react-router-dom';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.member};
  height: 5rem;
`;

const LogoLink = styled(Link)`
  color: white;
  font-size: 2.4rem;
  font-weight: 800;
  text-decoration: none;
  letter-spacing: 5px;
`;

export function LoginTitle() {
  return (
    <LogoContainer>
      <LogoLink to="/">로그인</LogoLink>
    </LogoContainer>
  );
}
