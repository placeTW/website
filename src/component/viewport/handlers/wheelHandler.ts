import Konva from "konva";

export const wheelHandler = (e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();
  const stage = e.target.getStage();
  if (!stage) return;

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  if (!pointer) return;

  const scaleBy = 1.1;
  const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };

  stage.position(newPos);
  stage.batchDraw();

  // Ensure stage remains draggable after zoom
  stage.draggable(true);
};