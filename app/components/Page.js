// @flow
import React from 'react';
import styled from 'styled-components';

type Props = {
  children: any,
};

export default ({ children }: Props) => (
  <Background>
    {children}
  </Background>
);

const Background = styled.div`
  background-color: #FFF;
  color: #000;
`;
