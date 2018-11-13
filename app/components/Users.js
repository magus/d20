// @flow
import type { UserLookup } from '~/app/types';

import React from 'react';
import styled from 'styled-components';
import _sortBy from 'lodash/sortBy';

import User from '~/app/components/User';

export default ({ users }: { users: UserLookup }) => {
  const userIds = _sortBy(Object.keys(users), userId => !users[userId].active);
  const userIdsByLastActive = _sortBy(userIds, userId => -1 * users[userId].lastActive);

  return (
    <Container>
      <Usernames>
        {userIdsByLastActive.map(userId => {
          return <User key={userId} identity={users[userId]} />;
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
