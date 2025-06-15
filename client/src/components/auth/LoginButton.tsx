import type { SyntheticEvent } from 'react';
import styled from 'styled-components';

interface Props {
  text: string;
  onClick: (e: SyntheticEvent) => void;
}

const Button = styled.button`
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  margin-top: 1rem;
  padding-top: 0.6rem;
  padding-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.member};
  border: 1px solid ${({ theme }) => theme.colors.member};
  border-radius: 4px;
  outline: none;
  transition: all 0.5s ease;

  &:hover .layer {
    top: 0;
  }
`;

const Layer = styled.div`
  position: absolute;
  color: white;
  top: -70px;
  left: 0;
  width: 100%;
  padding: 10px 0;
  background-color: ${({ theme }) => theme.colors.member};
  transition: all 0.4s ease;
`;

export function LoginButton({ text, onClick }: Props) {
  return (
    <Button onClick={onClick}>
      <Layer className="layer">어서오세요!</Layer>
      {text}
    </Button>
  );
}
