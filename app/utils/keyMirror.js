// @flow
import deepFreeze from '~/app/utils/deepFreeze';

// $FlowFixMe
export function keyMirror<O>(obj: O): $ObjMapi<O, <K>(k: K) => K> {
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('keyMirror(...): Argument must be an object.');
  }

  const mirror = {};

  Object.keys(obj).forEach(key => {
    mirror[key] = key;
  });

  return deepFreeze(mirror);
}

export default keyMirror;
