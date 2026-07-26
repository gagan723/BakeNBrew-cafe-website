const MenuService = require("../services/MenuService");

async function listMenu(req, res, next) {
  try {
    const items = await MenuService.searchMenu({ category: req.query.category });
    res.json({ items });
  } catch (error) { next(error); }
}

async function createMenuItem(req, res, next) {
  try {
    const { name, description, price, category } = req.body;
    const item = await MenuService.createMenuItem({ name, description, price, category, image: req.file?.path });
    res.status(201).json({ item });
  } catch (error) { next(error); }
}

async function archiveMenuItem(req, res, next) {
  try {
    const item = await MenuService.archiveMenuItem(req.params.id);
    res.json({ message: "Menu item archived", item });
  } catch (error) { next(error); }
}

module.exports = { listMenu, createMenuItem, archiveMenuItem };
