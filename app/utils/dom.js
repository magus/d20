// @flow
export function $id(id: string) {
  return document.getElementById(id);
}

export function $set(sel: Element, props: { [attr: string]: any }) {
  for (const i in props) sel.setAttribute(i, props[i]);
  return sel;
}

export function $firstParent(
  element?: Element,
  check: any => boolean
): ?Element {
  if (check(element)) return element;
  if (!element) return element;

  let found = element;
  while (found.parentElement && found.parentElement !== found) {
    if (check(found)) return found;
    if (!found) return element;
    found = found.parentElement;
  }

  return null;
}

export function $listen(
  element: Element,
  eventNames: string,
  handler: (event: any) => boolean | void,
  bubble: boolean = false
) {
  if (typeof eventNames !== 'string') throw new Error('invalid event name(s)');
  const events = eventNames.split(' ');
  events.forEach(e => element.addEventListener(e, handler, bubble));

  // Return an object with a 'remove' method
  return {
    element,
    events,
    handler,
    remove: () => {
      // Remove all handlers
      events.forEach(e => element.removeEventListener(e, handler, bubble));
    },
  };
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

type InteractEventType = {
  target: HTMLElement,
  changedTouches: ?TouchList,
  clientX?: number,
  clientY?: number,
} & (MouseEvent | TouchEvent);

export function $canvasMouseCoords(event: InteractEventType) {
  const coords = { x: 0, y: 0 };

  // get wrapping canvas to offset click coords
  const canvas = $firstParent(event.target, e => e.tagName === 'CANVAS');
  const { top, left } = (canvas && canvas.getBoundingClientRect()) || {};

  // get click coords
  const touches = event.changedTouches;
  const ex = touches ? touches[0].clientX : event.clientX;
  const ey = touches ? touches[0].clientY : event.clientY;

  // return if undefined
  if (
    left === undefined ||
    top === undefined ||
    ex === undefined ||
    ey === undefined
  )
    return coords;

  coords.x = ex - left;
  coords.y = ey - top;

  return coords;
}
