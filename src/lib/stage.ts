/** Where a photo sits inside a circular stage, as percentages of the stage's width (its diameter). */
export type StageBox = { w: number; left: number; top: number };

export type StageSlide = {
  /** Full photo, clipped to the circle */
  bg: string;
  /** The same photo with only the subject kept (transparent background), drawn over the circle's edge */
  cut?: string;
  alt: string;
  box: StageBox;
};

/**
 * Place a subject inside the stage.
 * Give the subject's pixel box in the photo and either the height or the width it should have,
 * as a multiple of the circle's diameter, plus where its bottom or its centre should land.
 */
export function place(opts: {
  size: [number, number];
  bbox: [number, number, number, number];
  height?: number;
  width?: number;
  /** bottom edge of the subject, as a fraction of the diameter from the top of the circle */
  bottom?: number;
  /** vertical centre of the subject, as a fraction of the diameter (used when bottom is not set) */
  centre?: number;
}): StageBox {
  const [pw] = opts.size;
  const [x0, y0, x1, y1] = opts.bbox;
  const s = opts.height ? opts.height / (y1 - y0) : (opts.width as number) / (x1 - x0); // diameters per pixel
  const cx = (x0 + x1) / 2;
  const top = opts.bottom !== undefined ? opts.bottom - y1 * s : (opts.centre ?? 0.5) - ((y0 + y1) / 2) * s;
  return { w: pw * s * 100, left: (0.5 - cx * s) * 100, top: top * 100 };
}
