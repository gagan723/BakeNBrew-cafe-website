const express = require('express')
const router = express.Router();
const cors = require('cors')
const upload = require("../utils/multerConfig")
const {test, registerUser, loginUser, getUser, getItems, addFoodItem, deleteFoodItem} = require('../controllers/AuthControllers')
const { authenticateToken } = require("../utils/utilities");
const { requireAuth, requireAdmin } = require("../middleware/auth");

//middleware
router.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_URL || 'https://bakenbrew-cafe-website-frontend.onrender.com'
    })
)

//Routes
router.get('/', test)

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/get-user',authenticateToken,getUser)
router.get('/get-items',getItems)
router.post("/add-item", requireAuth, requireAdmin, upload.single("image"), addFoodItem); // Legacy route
router.delete("/delete-item/:id", requireAuth, requireAdmin, deleteFoodItem); // Legacy route


module.exports = router
