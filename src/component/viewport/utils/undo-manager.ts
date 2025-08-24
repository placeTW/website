import { ViewportPixel } from '../types';  // Adjust the path as necessary

interface UndoState {
  editedPixels: ViewportPixel[];
}

export default class UndoManager {
  private history: UndoState[] = [];
  private redoHistory: UndoState[] = [];
  private limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  addState(state: UndoState) {
    this.history.push(state);
    // Clear redo history when a new state is added
    this.redoHistory = [];
    
    if (this.history.length > this.limit) {
      this.history.shift(); // Remove the oldest state if history exceeds limit
    }
    this.logStackSize();
  }

  undo(): UndoState | null {
    if (this.history.length > 0) {
      const previousState = this.history.pop();
      if (previousState) {
        this.redoHistory.push(previousState);
        // Limit redo history as well
        if (this.redoHistory.length > this.limit) {
          this.redoHistory.shift();
        }
      }
      this.logStackSize();
      return previousState || null;
    }
    this.logStackSize();
    return null;
  }

  redo(): UndoState | null {
    if (this.redoHistory.length > 0) {
      const nextState = this.redoHistory.pop();
      if (nextState) {
        this.history.push(nextState);
        // Limit history
        if (this.history.length > this.limit) {
          this.history.shift();
        }
      }
      this.logStackSize();
      return nextState || null;
    }
    this.logStackSize();
    return null;
  }

  clearHistory() {
    this.history = [];
    this.redoHistory = [];
    this.logStackSize();
  }

  hasHistory() {
    return this.history.length > 0;
  }

  hasRedoHistory() {
    return this.redoHistory.length > 0;
  }

  private logStackSize() {
    // Optional: Add logging for debugging
    // console.log(`Undo stack: ${this.history.length}, Redo stack: ${this.redoHistory.length}`);
  }
}
