require("dotenv").config();
const mongoose = require("mongoose");
const Table = require("../models/TableModel");

const tables = [
  { tableNumber: "T1", capacity: 2, area: "indoor" },
  { tableNumber: "T2", capacity: 2, area: "indoor" },
  { tableNumber: "T3", capacity: 4, area: "indoor" },
  { tableNumber: "T4", capacity: 4, area: "indoor" },
  { tableNumber: "T5", capacity: 6, area: "outdoor" },
  { tableNumber: "T6", capacity: 6, area: "outdoor" },
];

async function seedTables() {
  await mongoose.connect(process.env.MONGO_URL);
  await Promise.all(tables.map((table) => Table.updateOne({ tableNumber: table.tableNumber }, { $set: table }, { upsert: true })));
  console.log("Tables seeded");
  await mongoose.disconnect();
}

seedTables().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
