import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type RenderPdfInput = {
  title: string;
  patientReference: string;
  specialty: string;
  createdAt: string;
  approvedAt: string;
  noteText: string;
};

export async function renderNotePdf(input: RenderPdfInput) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  let y = height - 60;

  page.drawText(input.title, {
    x: 40,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.16, 0.28)
  });

  y -= 28;
  const metadata = [
    `Patient Reference: ${input.patientReference}`,
    `Specialty: ${input.specialty}`,
    `Generated: ${new Date(input.createdAt).toLocaleString()}`,
    `Approved: ${new Date(input.approvedAt).toLocaleString()}`
  ];

  metadata.forEach((line) => {
    page.drawText(line, { x: 40, y, size: 10, font, color: rgb(0.33, 0.38, 0.44) });
    y -= 16;
  });

  y -= 12;
  const lines = input.noteText.split("\n");
  for (const line of lines) {
    const chunks = line.length > 90 ? line.match(/.{1,90}(\s|$)/g) ?? [line] : [line];
    for (const chunk of chunks) {
      if (y < 50) {
        y = height - 60;
        page.drawText("", { x: 40, y, size: 12, font });
      }

      page.drawText(chunk.trimEnd(), {
        x: 40,
        y,
        size: 11,
        font,
        maxWidth: width - 80,
        color: rgb(0.1, 0.16, 0.28)
      });
      y -= 16;
    }
  }

  return pdfDoc.save();
}
