import type { TextStyle } from 'react-native';

/**
 * Shared geometry for the 'floating' field family (TextField, SelectField,
 * DatePickerField). All three must agree on box height and the two text bands,
 * otherwise a screen that mixes them reads uneven.
 */

/** Top of the band where the lifted label sits. */
export const FLOAT_LABEL_TOP = 7;
/** Line height of the value text. */
export const FLOAT_TEXT_LINE = 22;
/**
 * Top of the band where typed / selected text sits.
 *
 * Chosen so the band's centre is the box's centre: the label eats
 * FLOAT_LABEL_TOP + 14 = 21dp at the top, and 21 + 22/2 is exactly half of
 * FLOAT_BOX_HEIGHT. Anything lower and a leading icon looks like it is sagging;
 * anything higher and the text collides with the lifted label.
 */
export const FLOAT_TEXT_TOP = FLOAT_LABEL_TOP + 14;
/** Height of a floating box: two label lines' worth of slack around the text. */
export const FLOAT_BOX_HEIGHT = (FLOAT_TEXT_TOP + FLOAT_TEXT_LINE / 2) * 2;
/** Leading icon slot; the resting label indents by this plus a gap. */
export const FLOAT_ICON_SLOT = 18;

/**
 * Sits a child on the value band instead of the top of the box — leading icons,
 * trailing chevrons and any suffix text next to a floating box ('đ') all use it,
 * so their centres coincide with the typed text on every platform.
 */
export const FLOAT_BAND_STYLE: TextStyle = {
  marginTop: FLOAT_TEXT_TOP,
  lineHeight: FLOAT_TEXT_LINE,
};

/**
 * An icon that sits in the row next to a floating box's value text.
 *
 * The width is the whole point of this style. Left to itself, the slot is the
 * glyph's own advance width — a font-engine detail, not a layout constant — so
 * the text after it starts wherever the icon font happened to put that glyph's
 * side bearings, and the label above it, which is placed from FLOAT_ICON_SLOT,
 * ends up a few dp to one side. That disagreement only shows on device: the
 * browser and the native text engines measure the same icon differently.
 */
export const FLOAT_ICON_STYLE: TextStyle = {
  ...FLOAT_BAND_STYLE,
  width: FLOAT_ICON_SLOT,
  textAlign: 'center',
};
