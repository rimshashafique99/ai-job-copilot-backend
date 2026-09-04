const analyzeService = require('../services/analyzeService');

function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();
}

function makeEmitter(res) {
  return (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
}

async function analyze(req, res) {
 const { companyName, role, jobDescription, jobApplicationId } = req.body;

  // Still a normal 400 — headers not sent yet
  if (!companyName || !jobDescription) {
    return res.status(400).json({ success: false, error: 'companyName and jobDescription are required.' });
  }

  setupSSE(res);
  const emit = makeEmitter(res);

  try {
    await analyzeService.streamFullAnalysis({
      userId: req.user.id,
      companyName,
       role,
      jobDescription,
      jobApplicationId: jobApplicationId || null,
      emit,
    });
  } catch (err) {
    console.error('Fatal analyze error:', err);
    emit('fatal_error', { message: err.message || 'Something went wrong.' });
  } finally {
    res.end();
  }
}

async function regenerate(req, res) {
  const { id } = req.params;
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({ success: false, error: 'type is required.' });
  }

  setupSSE(res);
  const emit = makeEmitter(res);

  try {
    await analyzeService.streamRegenerateOutput({
      userId: req.user.id,
      jobApplicationId: id,
      type,
      emit,
    });
  } catch (err) {
    console.error('Fatal regenerate error:', err);
    emit('fatal_error', { message: err.message || 'Something went wrong.' });
  } finally {
    res.end();
  }
}

module.exports = { analyze, regenerate };