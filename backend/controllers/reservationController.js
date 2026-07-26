const ReservationService = require("../services/ReservationService");

function reservationInput(body) {
  return { partySize: Number(body.partySize), date: body.date, time: body.time };
}

async function checkAvailability(req, res, next) {
  try {
    const result = await ReservationService.checkAvailability(reservationInput(req.body));
    res.json({ ...result, tables: result.tables.map((table) => ({ id: table._id, tableNumber: table.tableNumber, capacity: table.capacity, area: table.area })) });
  } catch (error) { next(error); }
}

async function createReservation(req, res, next) {
  try {
    const reservation = await ReservationService.createReservation({ ...reservationInput(req.body), tableId: req.body.tableId, userId: req.auth.userId });
    res.status(201).json({ message: "Table reserved", reservation });
  } catch (error) { next(error); }
}

async function listMyReservations(req, res, next) {
  try {
    const reservations = await ReservationService.listMyReservations(req.auth.userId);
    res.json({ reservations });
  } catch (error) { next(error); }
}

module.exports = { checkAvailability, createReservation, listMyReservations };
