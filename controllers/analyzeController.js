const analyzeService = require('../services/analyzeService');

async function analyze(req, res, next) {
  try {
    const { companyName, jobDescription, jobApplicationId } = req.body;

    if (!companyName || !jobDescription) {
      return res.status(400).json({ success: false, error: 'companyName and jobDescription are required.' });
    }

    const result = await analyzeService.runFullAnalysis({
      userId: req.user.id,
      companyName,
      jobDescription,
      jobApplicationId: jobApplicationId || null
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function regenerate(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'type is required.' });
    }

    const output = await analyzeService.regenerateOutput({
      userId: req.user.id,
      jobApplicationId: id,
      type
    });

    res.status(200).json({ success: true, data: output });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyze, regenerate };