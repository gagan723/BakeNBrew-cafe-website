const Food = require("../models/FoodModel");

async function searchMenu({ query, category, availableOnly = false } = {}) {
  const filter = { isArchived: { $ne: true } };
  if (category) filter.category = category;
  if (availableOnly) filter.isAvailable = true;
  if (query?.trim()) filter.name = { $regex: query.trim(), $options: "i" };
  return Food.find(filter).sort({ name: 1 });
}

async function createMenuItem({ name, description, price, category, image }) {
  if (!name || !description || !category || !Number.isFinite(Number(price)) || Number(price) <= 0 || !image) {
    throw new Error("Name, description, positive price, category, and image are required");
  }
  return Food.create({
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    category: category.trim(),
    image,
  });
}

async function setMenuItemAvailability(id, isAvailable) {
  const item = await Food.findOneAndUpdate({ _id: id, isArchived: { $ne: true } }, { isAvailable }, { new: true });
  if (!item) throw new Error("Menu item not found");
  return item;
}

async function archiveMenuItem(id) {
  const item = await Food.findByIdAndUpdate(id, { isArchived: true, isAvailable: false }, { new: true });
  if (!item) throw new Error("Menu item not found");
  return item;
}

module.exports = { searchMenu, createMenuItem, setMenuItemAvailability, archiveMenuItem };
