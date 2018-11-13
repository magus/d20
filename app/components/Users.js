// @flow
import type { ActiveUsers, UserIdentity } from '~/app/types';
import { userFromId } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import { emojiFromUserId } from '~/app/utils/emoji';

function User({ identity }: { identity: UserIdentity }) {
  return (
    <Username>
      {emojiFromUserId(identity.id)} {identity.name}
    </Username>
  );
}

export default ({
  title = 'Users',
  users,
}: {
  title?: string,
  users: ActiveUsers,
}) => {
  const userIds = Object.keys(users);

  return (
    <Container>
      <h2>{title}</h2>

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
`;

const Username = styled.div`
  border: 1px solid #666;
  border-radius: 4px;
  padding: 4px;
  margin: 0 4px 0 0;
`;
