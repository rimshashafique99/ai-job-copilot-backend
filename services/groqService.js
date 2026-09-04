const Groq = require('groq-sdk');
const AppError = require('../utils/AppError');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';

function buildStreamPrompt({ cvText, jobDescription, companyName, type }) {
  const instructions = {
    coverLetter: `Write a tailored cover letter for a role at ${companyName} (plain text, 3-4 paragraphs). Return only the letter text — no preamble, no markdown, no headers.`,
    coldEmail: `Write a short cold outreach email to a recruiter at ${companyName} (plain text, under 150 words). Return only the email text — no preamble, no markdown, no subject line label.`,
    gapAnalysis: `List the skills or experience in the job description that are NOT clearly present in the candidate's CV. Return a plain text bulleted list, one gap per line, format: "- <area>: <what's missing> (severity: low/medium/high)". No preamble, no markdown headers.`,
    cvBullets: `Write 5-8 CV bullet points the candidate should add or rewrite to better match this job description. Return a plain text bulleted list, one bullet per line starting with "- ". No preamble, no markdown headers.`
  };

  return `You are a job application assistant. ${instructions[type]}

CV:
${cvText}

Job Description:
${jobDescription}

Company: ${companyName}`;
}

async function streamSingleOutput({ cvText, jobDescription, companyName, type, onToken }) {
  const prompt = buildStreamPrompt({ cvText, jobDescription, companyName, type });

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    stream: true
  });

  let accumulated = '';
  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content || '';
    if (token) {
      accumulated += token;
      onToken(token);
    }
  }
  return accumulated;
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

module.exports = {
  generateFullAnalysis,
  generateSingleOutput,
  parseJsonResponse,
  streamSingleOutput
};