// layout.ts: the frames of the functions lesson (shared by the page and the tests, so every practice picture is laid
// out in the same place it is drawn). The model sits left; the notation board is a little wider than the runtime's
// default (this topic writes tables and sets on it).
import { frame } from '../../../blocks/block';
import { box } from '../../../core/math';

/** the model on the left */
export const MODEL = frame(60, 70, 1040, 940);
/** the notation board */
export const BOARD_BOX = box(1160, 70, 1860, 1010);
/** left edge and width of the text on the board */
export const BX = BOARD_BOX.x0 + 50, BW = BOARD_BOX.w - 100;
/** a table on the board (top part) */
export const BOARD_TABLE = frame(1190, 92, 640, 560);
/** a table on the board under one or two lines of notation (practice) */
export const BOARD_TABLE_LOW = frame(1190, 330, 640, 660);
