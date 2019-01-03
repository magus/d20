// @flow
export default function deepFreeze(object: Object) {
  // Freeze this object
  Object.freeze(object);

  // Cannot recurse further, return object
  if (object === undefined) return object;

  // For each property...
  Object.getOwnPropertyNames(object).forEach(prop => {
    // deepFreeze objects and functions
    const thisProp = object[prop];
    if (
      thisProp !== null &&
      (typeof thisProp === 'object' || typeof thisProp === 'function') &&
      !Object.isFrozen(thisProp)
    ) {
      deepFreeze(thisProp);
    }
  });

  return object;
}
