const express = require('express')
const router = express.Router();
const cors = require('cors')
const upload = require("../utils/multerConfig")
const {test, registerUser, loginUser, getUser, getItems, getCart, setCart,addFoodItem,deleteFoodItem, reserve} = require('../controllers/AuthControllers')
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
router.get('/get-cart',authenticateToken,getCart)
router.put('/update-cart',authenticateToken,setCart)
router.post("/add-item", requireAuth, requireAdmin, upload.single("image"), addFoodItem); // Legacy route
router.delete("/delete-item/:id", requireAuth, requireAdmin, deleteFoodItem); // Legacy route
router.post("/reserve",authenticateToken,reserve)


module.exports = router
