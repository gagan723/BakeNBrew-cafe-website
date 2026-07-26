const Reservation = require("../models/ReservationModel");
const Table = require("../models/TableModel");

const RESERVATION_DURATION_MINUTES = 90;
const OPENING_HOUR = 9;
const CLOSING_HOUR = 22;

function parseReservationTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Enter a valid date and time");
  const [hours, minutes] = time.split(":").map(Number);
  if (hours < OPENING_HOUR || hours >= CLOSING_HOUR || minutes < 0 || minutes > 59) {
    throw new Error(`Reservations are available from ${OPENING_HOUR}:00 to ${CLOSING_HOUR}:00`);
  }
  const startAt = new Date(`${date}T${time}:00+05:30`);
  if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) throw new Error("Reservation time must be in the future");
  const endAt = new Date(startAt.getTime() + RESERVATION_DURATION_MINUTES * 60 * 1000);
  if (endAt.getUTCHours() > 16 || (endAt.getUTCHours() === 16 && endAt.getUTCMinutes() > 30)) {
    throw new Error("This reservation would end after closing time");
  }
  return { startAt, endAt };
}

async function findAvailableTables(partySize, startAt, endAt) {
  const candidates = await Table.find({ active: true, capacity: { $gte: partySize } }).sort({ capacity: 1 });
  if (!candidates.length) return [];
  const conflicts = await Reservation.find({
    tableId: { $in: candidates.map((table) => table._id) },
    status: "confirmed",
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }).select("tableId");
  const unavailable = new Set(conflicts.map((reservation) => String(reservation.tableId)));
  return candidates.filter((table) => !unavailable.has(String(table._id)));
}

async function checkAvailability({ partySize, date, time }) {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 12) throw new Error("Party size must be between 1 and 12");
  const { startAt, endAt } = parseReservationTime(date, time);
  const tables = await findAvailableTables(partySize, startAt, endAt);
  return { available: tables.length > 0, startAt, endAt, tables };
}

async function createReservation({ userId, partySize, date, time, tableId }) {
  const { startAt, endAt } = parseReservationTime(date, time);
  const availableTables = await findAvailableTables(partySize, startAt, endAt);
  const table = tableId
    ? availableTables.find((candidate) => String(candidate._id) === String(tableId))
    : availableTables[0];
  if (!table) throw new Error("No table is available for that time");

  return Reservation.create({ userId, tableId: table._id, partySize, startAt, endAt });
}

module.exports = { checkAvailability, createReservation };
