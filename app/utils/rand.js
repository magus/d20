// @flow
const rand = () => Math.random();

export default rand;

export function randVector(vector: { x: number, y: number }) {
  const random_angle = (rand() * Math.PI) / 5 - Math.PI / 5 / 2;

  const vec = {
    x: vector.x * Math.cos(random_angle) - vector.y * Math.sin(random_angle),
    y: vector.x * Math.sin(random_angle) + vector.y * Math.cos(random_angle),
  };

  if (vec.x === 0) vec.x = 0.01;
  if (vec.y === 0) vec.y = 0.01;

  return vec;
}
