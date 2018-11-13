// @flow
import type {
  ActiveUsers,
  RollEvent,
  DieRollType,
  UserIdentity,
  RollsByUser,
} from '~/app/types';
import { userFromId } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

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
    <div>
      <User identity={identity} />
      <Rolls>
        {rolls.map(roll => (
          <Roll key={roll.id} roll={roll} />
        ))}
      </Rolls>
    </div>
  );
}

function Roll({ roll }: { roll: RollEvent }) {
  return (
    <RollContainer>
      {roll.dieRolls.map((dieRoll, i) => {
        return <DieRoll key={i} dieRoll={dieRoll} />;
      })}
    </RollContainer>
  );
}
export default ({
  rolls,
  users,
}: {
  rolls: RollsByUser,
  users: ActiveUsers,
}) => {
  const userIds = Object.keys(users);

  return (
    <Container>
      {userIds.map(userId => {
        const identity: UserIdentity = users[userId] || userFromId(userId);

        return (
          <UserRolls key={userId} identity={identity} rolls={rolls[userId]} />
        );
      })}
    </Container>
  );
};

const Container = styled.div``;

const Rolls = styled.div`
  margin: 0 0 8px 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const RollContainer = styled.div``;

const DieRollContainer = styled.div`
  margin: 0 12px 0 0;
`;

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
