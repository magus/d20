// @flow
import type {
  UserLookup,
  UserRollEvent,
  RollType,
  UserIdentity,
} from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import TimeAgo from '~/app/components/TimeAgo';
import { UserEmoji } from '~/app/components/User';

function Roll({ roll }: { roll: RollType }) {
  const showTotal = roll.mod !== 0 || roll.result.length > 1;

  return (
    <DieRollContainer>
      <DieRollResult>{roll.result.join(' + ')}</DieRollResult>
      <DieRollInfo>{roll.original}</DieRollInfo>
      {!showTotal ? null : (
        <DieRollResult>
          {' = '}
          {roll.mod + roll.result.reduce((sum, v) => sum + v, 0)}
        </DieRollResult>
      )}
    </DieRollContainer>
  );
}

function UserRoll({ roll, user }: { roll: UserRollEvent, user: UserIdentity }) {
  return (
    <UserRollContainer>
      <UserAvatar>
        <UserEmoji identity={user} />
      </UserAvatar>

      <RollContent>
        <UserInfo>
          <Username>{user.name}</Username>
          <RollTime>
            <TimeAgo time={roll.time} />
          </RollTime>
        </UserInfo>
        <RollsContainer>
          {roll.rolls.map((roll, i) => {
            return <Roll key={i} roll={roll} />;
          })}
        </RollsContainer>
      </RollContent>
    </UserRollContainer>
  );
}
export default ({
  rolls,
  users,
}: {
  rolls: UserRollEvent[],
  users: UserLookup,
}) => {
  return (
    <Container>
      {rolls.map(roll => {
        const user = users[roll.userId];
        if (!user) return null;
        return <UserRoll key={roll.id} roll={roll} user={user} />;
      })}
      <WhiteMask />
    </Container>
  );
};

const MaskHeight = 30;

const Container = styled.div`
  margin: 0 0 ${MaskHeight}px 0;
`;

const UserRollContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  margin: 0 0 16px 0;
`;

const RollTime = styled.div`
  font-size: 10px;
  font-weight: 100;
`;

const DieRollContainer = styled.div`
  border: 1px solid red;
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

const UserAvatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #666;
  border-radius: 4px;
  font-size: 26px;
  padding: 4px;
  line-height: 30px;
  width: 30px;
  margin: 0 8px 0 0;
`;

const Username = styled.div`
  font-weight: 400;
  margin: 0 8px 0 0;
`;

const RollsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 1;
`;

const RollContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0 4px 0;
`;

const WhiteMask = styled.div`
  background: linear-gradient(rgba(255, 255, 255, 0), white 70%);
  height: ${MaskHeight}px;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
`;

// const Rolls = styled.div`
//   margin: 0 0 8px 0;
//   max-height: calc(${RollContainerHeight}px * ${props => props.rows || 2});
//   padding: 0 0 ${RollContainerHeight}px 0;
//   overflow: scroll;
//   -webkit-overflow-scrolling: touch;

//   display: flex;
//   flex-direction: column;
// `;

// const UserRollContainer = styled.div`
//   position: relative;
//   border-top: 1px solid #eaeaea;
//   padding: 8px 0 0 0;
//   margin: 16px 0 0 0;
// `;

// const RollsMask = styled.div`
//   background: linear-gradient(rgba(255, 255, 255, 0), white 40%);
//   height: ${RollContainerHeight}px;
//   width: 100%;
//   position: absolute;
//   bottom: 0;
//   left: 0;
// `;

// e.g.
// <UserRollContainer>
//   <User identity={identity} />
//   <Rolls rows={4}>
//     {rolls.map(roll => (
//       <UserRoll key={roll.id} roll={roll} />
//     ))}
//   </Rolls>
//   <RollsMask />
// </UserRollContainer>
