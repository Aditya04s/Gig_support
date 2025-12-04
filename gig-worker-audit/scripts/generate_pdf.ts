Generate a Node script generate_pdf.ts using pdfkit that:
- Accepts worker details + audit result
- Generates a clean PDF report
- Exports a function generatePDF(data): Promise<Buffer>
B) Code Skeleton
ts
Copy code
import PDFDocument from "pdfkit";

export function generatePDF(data: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers: any[] = [];

    doc.text("Gig Worker Audit Report", { align: "center" });
    doc.moveDown();
    doc.text(JSON.stringify(data, null, 2));

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.end();
  });
}