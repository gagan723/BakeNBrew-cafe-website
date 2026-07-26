const express = require("express");
const upload = require("../utils/multerConfig");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { listMenu, createMenuItem, archiveMenuItem } = require("../controllers/menuController");

const router = express.Router();
router.get("/", listMenu);
router.post("/", requireAuth, requireAdmin, upload.single("image"), createMenuItem);
router.delete("/:id", requireAuth, requireAdmin, archiveMenuItem);
module.exports = router;
