'use babel';

import { Disposable, CompositeDisposable } from "event-kit";
import { Pos } from "codemirror";

const NAMESPACE = "line-mover";
const MOVE_UP   = -1;
const MOVE_DOWN = 1;

export class LineMover extends Disposable {
  constructor(cm) {
    super(() => this.destroy());
    this.cm = cm;
    this.subscriptions = new CompositeDisposable();
    this.registerCommand("up"  , () => this.moveLinesUp());
    this.registerCommand("down", () => this.moveLinesDown());
  }

  /**
   * Returns the line number where the selection started or the current line of the cursorif no
   * selection.
   */
  getFirstSelectedLine() {
    return this.cm.doc.getCursor(true).line;
  }

  /**
   * Returns the line number where the selection endend or the current line of the cursor if no
   * selection.
   */
  getLastSelectedLine() {
    return this.cm.doc.getCursor(false).line;
  }

  /**
   * Returns the content of the line at the row index.
   * An empty string if index is out of the current doc.
   *
   * @param {number} index - Row's number, starting at 0.
   * @return {string} - Text
   */
  getLineContent(index) {
    if (index < this.cm.doc.firstLine() || index > this.cm.doc.lastLine()) {
      return ''
    }
    return this.cm.doc.getLine(index);
  }

  /**
   * Returns The text of the whole current selection, EOF characters included.
   *
   * @return {string}
   */
  getSelectedLinesContent() {
    let content = ''
    let index   = this.getFirstSelectedLine();
    while ( index <= this.getLastSelectedLine()) {
      content += this.getLineContent(index) + '\n';
      ++index;
    }
    return content;
  }

  /**
   * Replace the content of the lines between srcIdx and destIDX included by content.
   *
   * @param {number} srcIdx - Starting row, from 0.
   * @param {number} destIdx - Ending row, greater than srcIdx.
   * @param {string} content
   * @return {undefined}
   */
  replaceLines(srcIdx, destIdx, content) {
    // To not add empty line at the end of the doc
    if (destIdx == this.cm.doc.lastLine()) {
      content = content.substring(0, content.length -1);
    }
    this.cm.doc.replaceRange(
      content,
      new Pos(srcIdx, 0),
      new Pos(destIdx + 1, 0),
    );
  }

  /**
   * Move the current selected lines (or the line where the cursor is, if no selection)
   * one row above.
   *
   * @return {undefined}
   */
  moveLinesUp() {
    if (this.getFirstSelectedLine() > this.cm.doc.firstLine()) {
      const lineAbove      = this.getFirstSelectedLine() + MOVE_UP;
      const contentAbove   = this.getLineContent(lineAbove);
      const content        = this.getSelectedLinesContent();
      const selectionStart = this.cm.doc.getCursor(true);
      const selectionEnd   = this.cm.doc.getCursor(false);
      this.replaceLines(lineAbove, this.getLastSelectedLine(), content + contentAbove + '\n');
      this.updateCursor(selectionStart, selectionEnd, MOVE_UP);
    }
  }

  /**
   * Move the current selected lines (or the line where the cursor is, if no selection)
   * one row below.
   *
   * @return {undefined}
   */
  moveLinesDown() {
    if (this.getLastSelectedLine() < this.cm.doc.lastLine()) {
      const lineBellow     = this.getLastSelectedLine() + MOVE_DOWN;
      const contentBellow  = this.getLineContent(lineBellow);
      const content        = this.getSelectedLinesContent();
      const selectionStart = this.cm.doc.getCursor(true);
      const selectionEnd   = this.cm.doc.getCursor(false);
      this.replaceLines(this.getFirstSelectedLine(), lineBellow, contentBellow + '\n' + content);
      this.updateCursor(selectionStart, selectionEnd, MOVE_DOWN);
    }
  }

  /**
   * Adapting the cursor position/selections according to the moved line(s).
   *
   * @return {undefined}
   */
  updateCursor(oldPosStart, oldPosEnd, action) {
    this.cm.doc.setSelection(new Pos(oldPosStart.line + action, oldPosStart.ch),
                             new Pos(oldPosEnd.line + action, oldPosEnd.ch));
  }

  registerCommand(command, callback) {
    const targetElement = this.cm.display.wrapper;
    this.subscriptions.add(
      inkdrop.commands.add(targetElement, {
        [`${NAMESPACE}:${command}`]: () => {
          callback();
        },
      })
    );
  }

  destroy() {
    this.subscriptions.dispose();
  }
}
