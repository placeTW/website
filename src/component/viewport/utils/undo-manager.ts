import { ViewportPixel } from '../types';  // Adjust the path as necessary

interface UndoState {
  editedPixels: ViewportPixel[];
}

export default class UndoManager {
  private history: UndoState[] = [];
  private limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  addState(state: UndoState) {
    console.log("Adding state to history: ", state);
    this.history.push(state);
    if (this.history.length > this.limit) {
      this.history.shift(); // Remove the oldest state if history exceeds limit
    }
    this.logStackSize();
  }

  undo(): UndoState | null {
    if (this.history.length > 0) {
      const previousState = this.history.pop();
      console.log("Undoing state: ", previousState);
      this.logStackSize();
      return previousState || null;
    }
    this.logStackSize();
    return null;
  }

  clearHistory() {
    this.history = [];
    this.logStackSize();
  }

  hasHistory() {
    return this.history.length > 0;
  }

  private logStackSize() {
    console.log(`Undo stack size: ${this.history.length}`);
  }
}
