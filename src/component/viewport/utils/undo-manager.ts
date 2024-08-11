import { ViewportPixel } from "../types"; // Import the ViewportPixel type

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
  }

  undo(): UndoState | null {
    if (this.history.length > 0) {
      const previousState = this.history.pop();
      console.log("Undoing state: ", previousState);
      return previousState || null;
    }
    return null;
  }

  clearHistory() {
    this.history = [];
  }

  hasHistory() {
    return this.history.length > 0;
  }
}
