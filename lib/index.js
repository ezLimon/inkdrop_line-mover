'use babel';

import { CompositeDisposable } from "event-kit";
import { LineMover } from './line-mover';

let editor = null;

module.exports = {

  activate() {
    this.subscriptions = new CompositeDisposable();
    const mde = inkdrop.getActiveEditor()
    if (mde !== undefined) {
      editor = new LineMover(mde.cm);
    } else {
      this.subscriptions.add(
          inkdrop.onEditorLoad((e) => {
            editor = new LineMover(e.cm);
          })
      );
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    editor.dispose();
  },
};
