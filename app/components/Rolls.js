// @flow
import type {
  UserLookup,
  RollEvent,
  DieRollType,
  UserIdentity,
  RollsByUser,
} from '~/app/types';

import React from 'react';
import styled from 'styled-components';
import _sortBy from 'lodash/sortBy';

import TimeAgo from '~/app/components/TimeAgo';
import User from '~/app/components/User';

function DieRoll({ dieRoll }: { dieRoll: DieRollType }) {
  const { mod } = dieRoll;
  let modStr = '';
  if (mod !== 0) {
    const sign = mod > 0 ? '+' : '-';
    modStr = `${sign}${mod}`;
  }

  return (
    <DieRollContainer>
      <DieRollResult>{`${dieRoll.result}`}</DieRollResult>
      <DieRollInfo>{`(d${dieRoll.d}${modStr})`}</DieRollInfo>
    </DieRollContainer>
  );
}

function UserRolls({
  identity,
  rolls,
}: {
  identity: UserIdentity,
  rolls: RollEvent[],
}) {
  if (!rolls) return null;

  return (
    <UserRollContainer>
      <User identity={identity} />
      <Rolls rows={4}>
        {rolls.map(roll => (
          <Roll key={roll.id} roll={roll} />
        ))}
      </Rolls>
      <RollsMask />
    </UserRollContainer>
  );
}

function Roll({ roll }: { roll: RollEvent }) {
  return (
    <RollContainer>
      {roll.dieRolls.map((dieRoll, i) => {
        return <DieRoll key={i} dieRoll={dieRoll} />;
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
  min-height: ${RollContainerHeight}px;
  max-height: ${RollContainerHeight}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const RollTime = styled.div`
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
