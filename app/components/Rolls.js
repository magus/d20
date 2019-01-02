// @flow
import type {
  UserLookup,
  UserRollEvent,
  RollType,
  UserIdentity,
  RollsByUser,
} from '~/app/types';

import React from 'react';
import styled from 'styled-components';
import _sortBy from 'lodash/sortBy';

import TimeAgo from '~/app/components/TimeAgo';
import User from '~/app/components/User';

function Roll({ roll }: { roll: RollType }) {
  return (
    <DieRollContainer>
      <DieRollResult>{roll.result.join(' + ')}</DieRollResult>
      <DieRollInfo>{roll.original}</DieRollInfo>
    </DieRollContainer>
  );
}

function UserRolls({
  identity,
  rolls,
}: {
  identity: UserIdentity,
  rolls: UserRollEvent[],
}) {
  if (!rolls) return null;

  return (
    <UserRollContainer>
      <User identity={identity} />
      <Rolls rows={4}>
        {rolls.map(roll => (
          <UserRoll key={roll.id} roll={roll} />
        ))}
      </Rolls>
      <RollsMask />
    </UserRollContainer>
  );
}

function UserRoll({ roll }: { roll: UserRollEvent }) {
  return (
    <RollContainer>
      {roll.rolls.map((roll, i) => {
        return <Roll key={i} roll={roll} />;
      })}
      <RollTime>
        <TimeAgo time={roll.time} />
      </RollTime>
    </RollContainer>
  );
}
export default ({
  rolls,
  users,
}: {
  rolls: RollsByUser,
  users: UserLookup,
}) => {
  const userIds = _sortBy(Object.keys(users), userId => !users[userId].active);
  const userIdsByLastActive = _sortBy(
    userIds,
    userId => -1 * users[userId].lastActive
  );

  return (
    <Container>
      {userIdsByLastActive.map(userId => {
        return (
          <UserRolls
            key={userId}
            identity={users[userId]}
            rolls={rolls[userId]}
          />
        );
      })}
    </Container>
  );
};

const RollContainerHeight = 30;

const Container = styled.div``;

const Rolls = styled.div`
  margin: 0 0 8px 0;
  max-height: calc(${RollContainerHeight}px * ${props => props.rows || 2});
  padding: 0 0 ${RollContainerHeight}px 0;
  overflow: scroll;
  -webkit-overflow-scrolling: touch;

  display: flex;
  flex-direction: column;
`;

const RollContainer = styled.div`
  position: relative;

  min-height: ${RollContainerHeight}px;
  max-height: ${RollContainerHeight}px;
  display: flex;
`;

const RollTime = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;

  font-size: 10px;
  font-weight: 100;
  align-self: flex-end;
`;

const DieRollContainer = styled.div``;

const DieRollResult = styled.span`
  color: #000;
  font-weight: 700;
  font-size: 20px;
  margin: 0 2px 0 0;
`;
const DieRollInfo = styled.span`
  color: #999;
  font-weight: 100;
  font-size: 12px;
`;

const UserRollContainer = styled.div`
  position: relative;
  border-top: 1px solid #eaeaea;
  padding: 8px 0 0 0;
  margin: 16px 0 0 0;
`;

const RollsMask = styled.div`
  background: linear-gradient(rgba(255, 255, 255, 0), white 40%);
  height: ${RollContainerHeight}px;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
`;
