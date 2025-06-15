import type { ChangeEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import useAuthStore from '../../libs/stores/auth';

interface Props {
  name: 'username' | 'password';
  type: string;
  onKeyPress?: (e: KeyboardEvent<HTMLInputElement> & MouseEvent) => void;
}

const StyledInput = styled.input`
  display: block;
  width: 92%;
  padding: 10px;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.member};

  &:focus {
    outline: none;
  }

  &:focus ~ label,
  &:valid ~ label {
    top: -10px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.member};
  }

  &:focus ~ .bar:before {
    left: 0;
    right: 0;
  }
`;

export function LoginInput({ name, type, onKeyPress }: Props) {
  const value = useAuthStore((state) => state[name]);
  const setField = useAuthStore((state) => state.setField);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField(name, e.target.value);
  };

  return (
    <StyledInput
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyPress}
      required
    />
  );
}
