// @flow

function hash(value) {
  let hash = 0;

  if (value.length === 0) return hash;

  let chr;
  for (let i = 0; i < value.length; i++) {
    chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

export function emojiFromUserId(userId: string) {
  const emoji = hash(userId) % UserEmoji.length;
  return UserEmoji[emoji];
}

export const UserEmoji = [
  '😎',
  '😜',
  '🤔',
  '🤩',
  '😒',
  '😏',
  '😠',
  '😡',
  '🤬',
  '😤',
  '😁',
  '🤐',
  '😪',
  '😴',
  '😫',
  '😅',
  '😂',
  '😉',
  '🤠',
  '🤡',
  '👹',
  '💀',
  '👻',
  '👽',
  '👾',
  '🤖',
  '💩',
  '😼',
  '🦄',
  '🐉',
  '🦖',
  '🦇',
  '🧙',
  '🧜',
  '🧛',
  '🏹',
  '🔫',
  '💣',
];
