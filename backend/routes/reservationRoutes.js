const express = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/reservationController");

const router = express.Router();
router.post("/availability", requireAuth, controller.checkAvailability);
router.post("/", requireAuth, controller.createReservation);
router.get("/me", requireAuth, controller.listMyReservations);
module.exports = router;
