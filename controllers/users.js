const { compare } = require("bcrypt");
const mysql =require("mysql");
const jwt = require('jsonwebtoken' );
const { promisify }= require('util');

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database:process.env.DATABASE
});


exports.login=async (req, res) => {

    try{
        const{usertype,username,password }=req.body;
        if(!usertype || !username || !password){
            return res.status(400).render('index',{msg:"Please Enter Usertype, UserName and Password"})
         }

         else if (usertype == "admin"){
         con.query('SELECT * FROM admin WHERE username = ?',[username],async(error,result)=>{
            if(error){
                throw error  
            }

            if (result.length<=0 ){
                return res.status(401).render('index',{msg:'User Not Found'})
            }
            else{
                if(result[0].password !== password){
                return res.status(401).render('index',{msg:'Incorrect Password'})     
                }
                else{
                    const id =result[0].id;
                    const token = jwt.sign({id: id},process.env.JWT_SECRECT,{
                        expiresIn:process.env.JWT_EXPIRES_IN }) 
                        
                    const cookieoperation ={
                        expires: new Date(
                            Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
                        ),
                        httpOnly:true,
                    }
                    res.cookie('admin',token,cookieoperation);
                    res.status(200).redirect('/admin')
                    
                    // res.render('admin',{msg:'Admin'})
            }
            }
         })

         }
        else if (usertype == "teacher"){
            con.query('SELECT * FROM teacher WHERE username = ?',[username],async(error,result)=>{
                if(error){
                    throw error  
                }
    
                if (result.length<=0 ){
                    return res.status(401).render('index',{msg:'User Not Found'})
                }
                else{
                    if(result[0].password !== password){
                    return res.status(401).render('index',{msg:'Incorrect Password'})     
                    }
                    else{
                        const id =result[0].id;
                    const token = jwt.sign({id: id},process.env.JWT_SECRECT,{
                        expiresIn:process.env.JWT_EXPIRES_IN }) 
                        
                    const cookieoperation ={
                        expires: new Date(
                            Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
                        ),
                        httpOnly:true,
                    }
                    res.cookie('teacher',token,cookieoperation);
                    console.log('token: '+ token)
                    res.status(200).redirect('/home')
                        
                    }
                }
             })
        }

    }
    catch(error){
        console.log(error)
    }

 
    // if (usertype == "teacher"){
    //     con.query('SELECT * FROM teacher WHERE username = ?',[username], (err, results) => {
    //         if (err) {
    //             throw err;
    //         }
            
    //         // Check if user exists
    //         if (results.length > 0) {
    //             // Check if password is correct
    //             if (results[0].password === password) {
                    
    //                 var sql = "SELECT * from students";

    //                 con.query(sql, function(error, result) {
    //                     if(error) console.log(error);
    //                     // console.log(result)
    //                     res.render("attendance",{students: result});
    //                 });

    //             } else {
    //                 res.render('index',{msg:'Incorrect Password '});

    //             }
    //         } else {
    //             res.render('index',{msg:'Incorrect Username '});

    //         }
    //     });
    // }

    // else if(usertype == "admin"){
    //     con.query('SELECT * FROM admin WHERE username = ?',[username], (err, results) => {
    //         if (err) {
    //             throw err;
    //         }
    //         // Check if user exists
    //         if (results.length > 0) {
    //             // Check if password is correct
    //             if (results[0].password === password) {
    //                 res.render('admin',{msg:username});
    //             } else {
    //                 res.render('index',{msg:'Incorrect Password '});
    //             }
    //         } else {
    //             res.render('index',{msg:'Incorrect Username '});
    //         }
    //     });
    // }
};

exports.isloggedin = async (req, res, next) =>{
    // req.name = 'check login'

    if(req.cookies.admin){

        try{
            const decode = await promisify(jwt.verify)(
                req.cookies.admin,
                process.env.JWT_SECRECT
            )
            console.log(decode)
            con.query('select * from teacher ',(err,result)=>{
                // console.log(result)

                if(!result){
                    return next()
                }
                req.user = result
                return next()
            })

            con.query('select * from students ',(err,result)=>{
                // console.log(result)

                if(!result){
                    return next()
                }
                req.students = result
                return next()
            })
        }
      catch(error){
        console.log(error)
        return next()
      }
    }

    else{
        next();

    }
}


exports.isloggedin2 = async (req, res, next) =>{

    if(req.cookies.teacher){

        try{
            const decode = await promisify(jwt.verify)(
                req.cookies.teacher,
                process.env.JWT_SECRECT
            )
            console.log(decode)
            module.exports.id = decode.id;
            console.log(module.exports.id)
            con.query('select * from teacher where id=? ',[decode.id],(err,result)=>{
                console.log(result)
            
                if(!result){
                    return
                }
                else{
                    req.user = result
                }
            })
            next();
        }
      catch(error){
        console.log(error)
        return next()
      }
    }
    else{
        res.redirect('/login')
    }
}




exports.adminlogout = async (req,res) =>{

    res.cookie("admin","logout",{
        expires:new Date(Date.now() + 2 * 1000 ),
        httpOnly:true,
    });
    res.status(200).redirect('/');
}
  
exports.logout = async (req,res) =>{

    res.cookie("teacher","logout",{
        expires:new Date(Date.now() + 2 * 1000 ),
        httpOnly:true,
    });
    res.status(200).redirect('/');
}
