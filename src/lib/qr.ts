import QRCode from "qrcode";

/** A square boolean grid of QR modules: true = dark. */
export function qrMatrix(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const rows: boolean[][] = [];
  for (let y = 0; y < modules.size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < modules.size; x++) row.push(!!modules.get(y, x));
    rows.push(row);
  }
  return rows;
}
