// @flow
export function firstParent(element: Node, check: any => boolean) {
  if (check(element)) return element;

  let found = element;
  while (found.parentNode && found.parentNode !== found) {
    if (check(found)) return found;
    if (!found) return element;
    found = found.parentNode;
  }

  return null;
}
