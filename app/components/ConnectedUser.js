// @flow
import type { UserIdentity } from "~/app/types";

import React from "react";
import styled from "styled-components";

import User from '~/app/components/User';

export default function ConnectedUser({ user }: { user: UserIdentity }) {
  return (
    <Container>
      <User identity={user} />
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
`;
