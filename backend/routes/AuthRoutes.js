const express = require('express')
const router = express.Router();
const cors = require('cors')
const upload = require("../utils/multerConfig")
const {test, registerUser, loginUser, getUser, getItems, getCart, setCart,addFoodItem,deleteFoodItem, reserve} = require('../controllers/AuthControllers')
const { authenticateToken } = require("../utils/utilities");

//middleware
router.use(
    cors({
        credentials: true,
        origin: 'https://bakenbrew-cafe-website-frontend.onrender.com'
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
router.post("/add-item", upload.single("image"), addFoodItem); // Image is uploaded as 'image'
router.delete("/delete-item/:id",authenticateToken,deleteFoodItem)
router.post("/reserve",authenticateToken,reserve)


module.exports = router
