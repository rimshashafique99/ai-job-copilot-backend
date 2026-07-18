const trackerService = require('../services/trackerService');

async function create(req, res, next) {
  try {
    const { role, companyName, jobTitle, stage, tag, jobLink } = req.body;
    if (!companyName) {
      return res.status(400).json({ success: false, error: 'companyName is required.' });
    }

    const jobApplication = await trackerService.createManual({
      userId: req.user.id, role, companyName, jobTitle, stage, tag, jobLink
    });

    res.status(201).json({ success: true, data: jobApplication });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const jobApplications = await trackerService.listForUser(req.user.id);
    res.status(200).json({ success: true, data: jobApplications });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const jobApplication = await trackerService.getOne(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: jobApplication });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { role, companyName, jobTitle, jobLink, tag, stage, interviewDate } = req.body;
    const fields = {};
    if (role !== undefined) fields.role = role;
    if (companyName !== undefined) fields.companyName = companyName;
    if (jobTitle !== undefined) fields.jobTitle = jobTitle;
    if (jobLink !== undefined) fields.jobLink = jobLink;
    if (tag !== undefined) fields.tag = tag;
    if (stage !== undefined) fields.stage = stage;
    if (interviewDate !== undefined) fields.interviewDate = interviewDate;

    const updated = await trackerService.updateOne(req.user.id, req.params.id, fields);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await trackerService.deleteOne(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove };