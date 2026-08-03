const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const profileController = require("../controllers/profilecontroller");

const upload = multer({
  storage: multer.memoryStorage(), // keeps file in RAM, never touches disk — matches our "don't store the raw PDF" decision
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.get("/", requireAuth, profileController.getProfile);
router.put("/", requireAuth, profileController.updateProfile);
router.post(
  "/cv",
  requireAuth,
  upload.single("cv"),
  profileController.uploadCv,
);

module.exports = router;
