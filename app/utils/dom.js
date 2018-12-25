// @flow
export function $id(id: string) {
  return document.getElementById(id);
}

export function $set(sel: Element, props: { [attr: string]: any }) {
  for (const i in props) sel.setAttribute(i, props[i]);
  return sel;
}

export function $firstParent(element: Element, check: any => boolean) {
  if (check(element)) return element;

  let found = element;
  while (found.parentNode && found.parentNode !== found) {
    if (check(found)) return found;
    if (!found) return element;
    found = found.parentNode;
  }

  return null;
}

export function $listen(
  element: Element,
  eventNames: string,
  handler: (event: Event) => boolean | void,
  bubble: boolean = false
) {
  if (typeof eventNames !== 'string') throw new Error('invalid event name(s)');
  const events = eventNames.split(' ');
  events.forEach(e => element.addEventListener(e, handler, bubble));
}

export function $event(
  element: Element,
  eventName: string,
  bubble: boolean = true,
  cancelable: boolean = true
) {
  const evt = document.createEvent('UIEvents');
  evt.initEvent(eventName, bubble, cancelable);
  element.dispatchEvent(evt);
}
