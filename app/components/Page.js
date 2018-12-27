// @flow
import React from 'react';
import styled from 'styled-components';

type Props = {
  children: any,
};

export default ({ children }: Props) => (
  <Container>
    {children}
  </Container>
);

const Container = styled.div`
  color: #000;
  margin: 20px;
`;
