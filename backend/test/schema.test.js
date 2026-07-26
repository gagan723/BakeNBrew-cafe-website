const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../models/UserModel");
const Cart = require("../models/CartModel");
const Reservation = require("../models/ReservationModel");

test("user schema does not duplicate cart or reservation data", () => {
  assert.equal(User.schema.path("cartData"), undefined);
  assert.equal(User.schema.path("reservations"), undefined);
});

test("cart and reservation data have dedicated canonical models", () => {
  assert.ok(Cart.schema.path("userId"));
  assert.ok(Cart.schema.path("items"));
  assert.ok(Reservation.schema.path("userId"));
  assert.ok(Reservation.schema.path("tableId"));
  assert.ok(Reservation.schema.path("partySize"));
  assert.ok(Reservation.schema.path("startAt"));
});
