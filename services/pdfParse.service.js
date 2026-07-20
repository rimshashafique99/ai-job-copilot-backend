const pdfParse = require("pdf-parse");

console.log(pdfParse);

async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

module.exports = { extractTextFromPdf };