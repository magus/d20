// @flow
import type { UserLookup, UserIdentity } from '~/app/types';
import { userFromId } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import User from '~/app/components/User';

export default ({
  users,
  activeUsers,
}: {
  users: UserLookup,
  activeUsers: UserLookup,
}) => {
  const userIds = Object.keys(users);
  const activeUserIds = Object.keys(activeUsers);

  return (
    <Container>
      {/* Active */}
      <Usernames>
      {activeUserIds.map(userId => {
          const identity: UserIdentity = users[userId] || userFromId(userId);

          return <User key={userId} identity={identity} />;
        })}
      </Usernames>

      {/* Inactive */}
      <Usernames>
        {userIds.map(userId => {
          // Do not show active users here
          if (userId in activeUsers) return;

          const identity: UserIdentity = users[userId] || userFromId(userId);

          return <User key={userId} identity={identity} inactive />;
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
