const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/users');


router.post('/login',usercontroller.login); 
router.get('/adminlogout',usercontroller.adminlogout); 
router.get('/logout',usercontroller.logout); 

module.exports=router;