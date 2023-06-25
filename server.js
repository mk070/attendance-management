const express = require('express');
const path = require('path');
const app = express();
const doenv = require('dotenv');
const mysql =require("mysql");
const ejs = require('ejs');
const cookieParser = require('cookie-parser')
const session = require('express-session');
const bodyParser = require('body-parser');


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
  }));

app.use(cookieParser());

const publicdir = path.join(__dirname+'/public');
app.use(express.static(publicdir));

app.use(express.urlencoded({ extended:true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

app.set('view engine','ejs');

doenv.config({
    path:'./.env'
});

var con =mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database:process.env.DATABASE

});


app.use('/', require('./routes/pages'));
app.use('/admin', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(process.env.PORT,()=>{
    console.log('------server started-------')
    console.log("http://localhost:7000/")
});
