const express = require('express');
const router = express.Router();
const mysql =require("mysql");
const usercontroller = require('../controllers/users');
const clientcontroller = require('../controllers/client');
const { render } = require('ejs');


var con =mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database:process.env.DATABASE

});
 
 
router.get(['/','/login'],function(req, res){
    res.render('index',{msg:""});
});

router.get('/home', usercontroller.isloggedin2, clientcontroller.facultydetails);

router.get('/:year_id/:dept_id/:subject/attendance/:slot', usercontroller.isloggedin2, clientcontroller.attendance);

router.post('/:year_id/:dept_id/:subject/hrs_conducted', usercontroller.isloggedin2, clientcontroller.hrs_conducted);

router.post('/save-attendance', usercontroller.isloggedin2, clientcontroller.save_attendance);


router.post('/attendance-search',clientcontroller.findattendance)

router.get('/admin',usercontroller.isloggedin, function(req, res){
    if(req.user){
        res.render('admin',{user : req.user});
    }
    else{
        res.redirect('/login')
    }
});


router.get('/faculty',usercontroller.isloggedin,function(req, res){
    if(req.user){
            let addedalert = req.query.facultyadded
            let updatealert = req.query.facultyupdated
            let deletealert = req.query.facultyremoved
            res.render("faculty",{teacher: req.user,addedalert,deletealert,updatealert});
        }
        else{
            res.redirect('/login')
        }
});

router.post('/addfaculty',clientcontroller.addfaculty)

router.get('/edit-faculty/:id',clientcontroller.editfaculty,(req,res)=>{
    res.render('edit-faculty')
})

router.post('/edit-faculty/:id',clientcontroller.updatefaculty)

router.post('/faculty-search',clientcontroller.findfaculty)


router.get('/deletefaculty/:id',clientcontroller.deletefaculty)


router.get('/students',usercontroller.isloggedin, clientcontroller.studentdata,function(req, res){
    if(req.user || data){
        let addedalert = req.query.studentadded
        let updatealert = req.query.studentupdated
        let deletealert = req.query.studentremoved
         res.render('students',{student: data,addedalert,deletealert,updatealert});
    }
    else{
        res.redirect('/login')
    }
});


router.post('/addstudent',clientcontroller.addstudent)

router.get('/edit-student/:id',clientcontroller.editstudent,(req,res)=>{
    res.render('edit-student')
})

router.post('/edit-student/:id',clientcontroller.updatestudent)

router.post('/student-search',clientcontroller.findstudent)


router.get('/deletestudent/:id',clientcontroller.deletestudent)



router.get('/reports',usercontroller.isloggedin,function(req, res){
    if(req.user){
            router.get('/reports',clientcontroller.report)
        }
        else{
            res.redirect('/login')
        }
});
router.post('/report-search',clientcontroller.findreport)


router.get('/calander',usercontroller.isloggedin,function(req, res){
    if(req.user){
        res.render('calander',{msg:""});

        }
        else{
            res.redirect('/login')
        }
});




// router.post('/admin',function(req, res){
    
//     const { username,name, password}=req.body;

   

  
//         var sql = "INSERT INTO teacher(name, username, password) VALUES ?";

//         var values = [[name, username, password]];
//         con.query(sql,[values], (error, result) => {
//             if(error) throw error;
//             // alert('Registered Sucessfully'+ result.insertId);
//             res.send('Registered Sucessfully'+ result.insertId);
//         });

// });



module.exports = router;