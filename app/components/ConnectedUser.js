// @flow
import type { UserIdentity } from "~/app/types";

import React from "react";
import styled from "styled-components";

export default function ConnectedUser({ user }: { user: UserIdentity }) {
  return (
    <Container>
      {user.name}
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
`;
