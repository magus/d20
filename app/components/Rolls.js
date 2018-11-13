// @flow
import type {
  ActiveUsers,
  RollEvent,
  DieRollType,
} from '~/app/types';

import React from 'react';
import styled from 'styled-components';

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
