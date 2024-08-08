import { Line } from "react-konva";

export const drawGrid = (width: number, height: number, gridSize: number) => {
  const lines = [];
  for (let i = 0; i < width / gridSize; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * gridSize, 0, i * gridSize, height]}
        stroke="#ddd"
        strokeWidth={0.5}
      />
    );
  }
  for (let j = 0; j < height / gridSize; j++) {
    lines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * gridSize, width, j * gridSize]}
        stroke="#ddd"
        strokeWidth={0.5}
      />
    );
  }
  return lines;
};