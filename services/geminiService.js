const Groq = require('groq-sdk');
const AppError = require('../utils/AppError');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

function buildFullPrompt({ cvText, jobDescription, companyName }) {
  return `You are a job application assistant. Given the candidate's CV and a job description, produce a JSON object with EXACTLY these keys: "role", "coverLetter", "coldEmail", "gapAnalysis", "cvBullets".

- "role": the job title extracted from the JD (short string, e.g. "Senior Frontend Engineer")
- "coverLetter": a tailored cover letter (plain text, 3-4 paragraphs)
- "coldEmail": a short cold outreach email to a recruiter at ${companyName} (plain text, under 150 words)
- "gapAnalysis": an array of objects [{ "area": string, "gap": string, "severity": "low"|"medium"|"high" }] listing skills/experience in the JD not clearly present in the CV
- "cvBullets": an array of strings — exact bullet points the candidate should add to their CV to better match this JD

Return ONLY valid JSON. No markdown fences, no preamble.

CV:
${cvText}

Job Description:
${jobDescription}

Company: ${companyName}`;
}

function buildSinglePrompt({ cvText, jobDescription, companyName, type }) {
  const instructions = {
    coverLetter: `a tailored cover letter (plain text, 3-4 paragraphs) for ${companyName}`,
    coldEmail: `a short cold outreach email to a recruiter at ${companyName} (plain text, under 150 words)`,
    gapAnalysis: `a JSON array [{ "area": string, "gap": string, "severity": "low"|"medium"|"high" }] listing skills/experience in the JD not clearly present in the CV`,
    cvBullets: `a JSON array of strings — exact bullet points the candidate should add to their CV to better match this JD`
  };

  const isJsonArray = type === 'gapAnalysis' || type === 'cvBullets';

  return `You are a job application assistant. Generate ${instructions[type]}.

Return ONLY the ${isJsonArray ? 'JSON array' : 'plain text'}, wrapped in a JSON object like {"${type}": ${isJsonArray ? '[...]' : '"..."'}}. No markdown fences, no preamble.

CV:
${cvText}

Job Description:
${jobDescription}

Company: ${companyName}`;
}
function parseJsonResponse(rawText) {
  const cleaned = rawText
    .replace(/```json|```/g, '')
    .trim()
    .replace(/\r\n|\r|\n/g, '\\n'); // escape literal newlines inside string values

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.log('RAW AI RESPONSE THAT FAILED TO PARSE:', rawText);
    throw new AppError('Failed to parse AI response', 502);
  }
}
async function generateFullAnalysis({ cvText, jobDescription, companyName }) {
  const prompt = buildFullPrompt({ cvText, jobDescription, companyName });
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  const text = completion.choices[0].message.content;
  return parseJsonResponse(text);
}

async function generateSingleOutput({ cvText, jobDescription, companyName, type }) {
  const prompt = buildSinglePrompt({ cvText, jobDescription, companyName, type });
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  const text = completion.choices[0].message.content;
  const parsed = parseJsonResponse(text);
  return parsed[type];
}

module.exports = { generateFullAnalysis, generateSingleOutput };