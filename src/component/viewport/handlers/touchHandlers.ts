import Konva from "konva";
import { GRID_SIZE } from "../constants";

export const touchHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
) => ({
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
    const stageContainer = (e.target as Element).closest(".konvajs-content");
    if (!stageContainer) return;

    // Check if the first child is a Konva Stage
    const stage = stageContainer.firstChild;
    if (stage instanceof Konva.Stage) {
      if (e.touches.length === 1) {
        stage.draggable(false);
      } else if (e.touches.length === 2) {
        stage.draggable(true);
      }
    }
  },
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => {
    const stageContainer = (e.target as Element).closest(".konvajs-content");
    if (!stageContainer) return;
    const stage = stageContainer.firstChild;

    if (!(stage instanceof Konva.Stage)) {
      return
    }

    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );

      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      let lastDist = parseFloat(e.currentTarget.dataset.lastDist || "0");
      let lastCenter = JSON.parse(e.currentTarget.dataset.lastCenter || "{}");

      if (lastDist === 0) {
        lastDist = dist;
        lastCenter = center;
      } else {
        const scaleBy = dist / lastDist;
        const oldScale = stage.scaleX();
        const newScale = oldScale * scaleBy;

        const mousePointTo = {
          x: (center.x - stage.x()) / oldScale,
          y: (center.y - stage.y()) / oldScale,
        };

        stage.scale({ x: newScale, y: newScale });

        const dx = center.x - lastCenter.x;
        const dy = center.y - lastCenter.y;

        const newPos = {
          x: stage.x() + dx - mousePointTo.x * (newScale - oldScale),
          y: stage.y() + dy - mousePointTo.y * (newScale - oldScale),
        };

        stage.position(newPos);
        stage.batchDraw();
      }

      e.currentTarget.dataset.lastDist = dist.toString();
      e.currentTarget.dataset.lastCenter = JSON.stringify(center);
    }

    if (e.touches.length === 1 && isEditing && onPixelPaint) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scale = stage.scaleX();
      const x = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
      const y = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
      onPixelPaint(x, y);
    }
  },
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.lastDist = "0";
    e.currentTarget.dataset.lastCenter = "{}";
  },
});
