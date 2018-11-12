// @flow
import type { ActiveUsers } from "~/app/types";

import React from "react";
import styled from "styled-components";

function User({ name }: { name: string }) {
  return <div>{name}</div>;
}

export default ({ title = "Users", users }: { title: string, users: ActiveUsers }) => {
  const userIds = Object.keys(users);

  return (
    <Container>
      <h2>
        {userIds.length} {title}
      </h2>

      {userIds.map(userId => {
        const identity = users[userId] || { name: userId.slice(0, 4) };

        return <User key={userId} name={identity.name} />;
      })}
    </Container>
  );
};

const Container = styled.div``;
