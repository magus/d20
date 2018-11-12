// @flow
export default function roll(dieSides: number = 20) {
  return Math.floor(Math.random() * dieSides) + 1
}
