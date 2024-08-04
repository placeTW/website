export const createCheckerboardPattern = (
  color1: string,
  color2: string,
  size: number
): HTMLImageElement => {
  const canvas = document.createElement("canvas");
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(size, size, size, size);

    ctx.fillStyle = color2;
    ctx.fillRect(size, 0, size, size);
    ctx.fillRect(0, size, size, size);
  }

  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
};