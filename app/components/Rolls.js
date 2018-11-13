// @flow
import type { ActiveUsers, RollEvent, UserIdentity } from '~/app/types';
import { userFromId } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import User from '~/app/components/User';

function Roll({ roll, users }: { users: ActiveUsers, roll: RollEvent }) {
  const userId = roll.userId;
  const identity: UserIdentity = users[userId] || userFromId(userId);

  return (
    <RollContainer>
      <User key={userId} identity={identity} />
      {roll.dieRolls.map((dieRoll, i) => {
        const { mod } = dieRoll;
        let modStr;
        if (mod === 0) {
          modStr = '+0';
        } else {
          const sign = mod > 0 ? '+' : '-';
          modStr = `${sign}${mod}`;
        }

        return <div key={i}>{`${dieRoll.result} (d${dieRoll.d}${modStr})`}</div>
      })}
    </RollContainer>
  );
}
export default ({
  rolls,
  users,
}: {
  rolls: RollEvent[],
  users: ActiveUsers,
}) => {
  return (
    <Container>
      <Rolls>
        {rolls.map(roll => (
          <Roll key={roll.id} roll={roll} users={users} />
        ))}
      </Rolls>
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
