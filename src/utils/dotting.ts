import { PixelModifyItem } from "dotting";

export const createDottingData = (
  rows: number,
  columns: number,
): Array<Array<PixelModifyItem>> => {
  const data: Array<Array<PixelModifyItem>> = [];
  for (let i = 0; i < columns; i++) {
    const row: Array<PixelModifyItem> = [];
    for (let j = 0; j < rows; j++) {
      row.push({ rowIndex: i, columnIndex: j, color: "" });
    }
    data.push(row);
  }
  return data;
};
