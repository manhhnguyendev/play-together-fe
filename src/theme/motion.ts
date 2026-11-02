import { Easing } from 'react-native';

export const duration = {
  press: 120,
  state: 180,
  enter: 240,
  exit: 200,
  sheet: 320,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
  linear: Easing.linear,
} as const;

export const distance = {
  micro: 4,
  slide: 8,
  card: 12,
  sheet: 24,
} as const;

export const press = {
  scale: 0.97,
  opacity: 0.82,
} as const;

/**
 * Stack transitions. The values are react-native-screens animation names, so
 * every navigator picks one of these three instead of inventing its own — the
 * direction a screen arrives from is what tells the user whether they drilled
 * into content or opened a task.
 *
 * One value drives both directions, and the native stack plays the reverse of
 * the animation declared on the screen being dismissed: a route that arrives
 * from the left leaves to the right when it is opened, and the screen beneath
 * it arrives from the right when it is closed. So `push` below means forward
 * enters from the left and back enters from the right — both trips of one route
 * always mirror, and a route can never slide in horizontally and leave
 * vertically. Pick the axis for the route, not the trip.
 */
export const stackTransition = {
  /**
   * Spine navigation, on the axis the app reads as "forward from the left,
   * back from the right". Chosen over the plain `slide_from_left` because on
   * Android that one is a linear 300ms shove, while this curve decelerates into
   * place in 200ms and lets the screen underneath drift only a third of the
   * width, which is what gives the stack a sense of depth.
   */
  push: 'ios_from_left' as const,
  /** A task that belongs to the hub it was opened from and dismisses back to it. */
  sheet: 'slide_from_bottom' as const,
  /** Swapping whole groups, where no direction is meaningful. */
  group: 'fade' as const,
} as const;
