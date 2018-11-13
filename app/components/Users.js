// @flow
import type { ActiveUsers, UserIdentity } from '~/app/types';
import { userFromId } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import User from '~/app/components/User';

export default ({
  users,
}: {
  users: ActiveUsers,
}) => {
  const userIds = Object.keys(users);

  return (
    <Container>
      <Usernames>
        {userIds.map(userId => {
          const identity: UserIdentity = users[userId] || userFromId(userId);

          return <User key={userId} identity={identity} />;
        })}
      </Usernames>
    </Container>
  );
};

const Container = styled.div``;

const Usernames = styled.div`
  margin: 0 0 8px 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;
