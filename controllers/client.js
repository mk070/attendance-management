const { compare } = require("bcrypt");
const mysql =require("mysql");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken' );
const { promisify }= require('util');
const { error } = require("console");
const { redirect } = require("statuses");
const usercontroller = require('../controllers/users');


var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database:process.env.DATABASE
});


//home page

exports.facultydetails = async (req,res,next)=>{

    sql = `SELECT t.name , y.year_id, y.year , d.dept_id, d.dept , s.subject_id , s.subject FROM teacher_info ti 
    JOIN teacher t ON ti.teacher_id = t.id 
    JOIN years y ON ti.years_id = y.year_id 
    JOIN dept d ON ti.dept_id = d.dept_id  
    JOIN subject s ON ti.subject_id = s.subject_id WHERE ti.teacher_id = ?`

    id = usercontroller.id

    con.query(sql, [id], (error, result) => {
        if (error) throw error;
    
        if (result.length > 0) {
        //   const teacherName = result[0].name; // Extract the teacher name from the result
    
          res.render("home", { teacher: result });
          global.teacher = result;
          console.log(global.teacher);
          
        } else {
          // Handle the case where no records are found
          console.log("No teacher found");
        }
      });
}


//attendance insert
// exports.attendance = async (req, res, next) => {
//   console.log('attendance page')

//   const { year_id, dept_id, subject, slot } = req.params;
//   console.log('slot: ', slot)

//   // if (slot == 2) {
//   //   req.session.slot1submitted = false;
//   //   req.session.slot2submitted = false;
//   // }

//   const isSlot1 = slot == 1;
//   const submitted = isSlot1 ? req.session.slot1submitted : req.session.slot2submitted; // Check if the form is submitted
//   const error = req.session.error || false; // Check if there is an error

//   global.year_id = year_id;
//   global.dept_id = dept_id;
//   global.subject = subject;
//   global.slot = slot;

//   console.log(global.year_id);
//   console.log(global.dept_id);
//   console.log(global.subject);
//   console.log(global.slot);

//   const sql = `
//     SELECT s.student_id, s.regno, s.firstname, a.hrs_conducted, a.hrs_attended
//     FROM students s
//     INNER JOIN attendance a ON s.student_id = a.student_id
//     WHERE s.year_id = ?
//       AND s.dept_id = ?
//       AND a.subject_id = (
//         SELECT subject_id
//         FROM subject
//         WHERE subject = ?
//       )
//     ORDER BY s.student_id ASC;
//   `;

//   con.query(sql, [year_id, dept_id, subject], (error, result) => {
//     if (error) throw error;

//     if (!result || result.length === 0) {
//       // Handle case when no students are found
//       res.render("attendance", { students: [], teacher: global.teacher, user: '', year_id, dept_id, subject, submitted, error });
//       console.log('no data -----------');
//       return;
//     }

//     res.render("attendance", { students: result, teacher: global.teacher, year_id, dept_id, subject, submitted, error });
//     global.students = result;
//     console.log(global.students);
//     next();
//   });
// };


exports.attendance = async (req, res, next) => {
  console.log('attendance page');

  const { year_id, dept_id, subject, slot } = req.params;
  console.log('slot1: ', slot);

  const isSlot1 = slot == 1;


  var sql = `
  SELECT s.student_id, s.regno, s.firstname, a.hrs_conducted, a.hrs_attended,a.percentage,submitted
  FROM students s
  INNER JOIN attendance a ON s.student_id = a.student_id
  WHERE s.year_id = ?
  AND s.dept_id = ?
  AND a.subject_id = (
      SELECT subject_id
      FROM subject
      WHERE subject = ?)

   ORDER BY s.student_id ASC;  `
;

  
  con.query(sql, [year_id, dept_id, subject], (error, result) => {

      if (error) throw error;
  
      if (result.length > 0) {
        const { submitted } = result[0];
    
        if (submitted) {
          // User has already submitted the data, render an error message or redirect to a different page
          global.submitted=true
        }
      }
    });


  const submittedSlot1 = req.session.slot1submitted || false; // Check if the form in slot 1 is submitted
  const submittedSlot2 = req.session.slot2submitted || false; // Check if the form in slot 2 is submitted
  // const submitted = isSlot1 ? req.session.slot1submitted : req.session.slot2submitted;
  const submitted =global.submitted ;
  const error = req.session.error || false; // Check if there is an error


  global.year_id = year_id;
  global.dept_id = dept_id;
  global.subject = subject;
  global.slot = slot;

  console.log(global.year_id);
  console.log(global.dept_id);
  console.log(global.subject);
  console.log(global.slot);

  
  // const userHasSubmitted = req.session.submitted || false;

  // if (userHasSubmitted) {
  //   // User has already submitted the data, render an error message or redirect to a different page
  //   return res.send( 'You have already submitted the data.' );
  //   // res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${global.slot}`);

  // }

  var sql = `
    SELECT s.student_id, s.regno, s.firstname, a.hrs_conducted, a.hrs_attended,a.percentage
    FROM students s
    INNER JOIN attendance a ON s.student_id = a.student_id
    WHERE s.year_id = ?
    AND s.dept_id = ?
    AND a.subject_id = (
        SELECT subject_id
        FROM subject
        WHERE subject = ?)
  
     ORDER BY s.student_id ASC;  `
  ;

  con.query(sql, [year_id, dept_id, subject], (error, result) => {
    if (error) throw error;

    if (!result || result.length === 0) {
      // Handle case when no students are found
      res.render("attendance", { students: [], teacher: global.teacher, user: '', submitted, error });
      console.log('no data -----------');
      return;
    }

    let students = result;

    if (slot === '1' && submittedSlot2) {
    
      const attendanceSlot1 = req.session.attendanceSlot1 || {};
      const percentage = req.session.percentage || {};
      const hrs_conducted = req.session.hrs_conducted || {};
      

      students = students.map((student) => ({
        ...student,
        hrs_attended: attendanceSlot1[student.student_id] || student.hrs_attended,
        percentage: percentage[student.student_id] || student.percentage,
        hrs_conducted: hrs_conducted || student.hrs_conducted
      
      }));
    }

    res.render("attendance", { students, teacher: global.teacher, year_id: global.year_id, dept_id: global.dept_id, subject: global.subject,submitted, error });
    global.students = students;
    console.log(global.students);
    next();
  });
};


exports.hrs_conducted = async (req,res,next)=>{

    slot = global.slot ;
    const isSlot1 = global.slot === '1';
    const hrs_conducted = req.body.hrs_conducted;
    global.hrs_conducted = hrs_conducted;
    const { year_id, dept_id, subject } = req.params;

    console.log('hrs page')
    if (isSlot1) {

    const sql = `
    UPDATE attendance
    SET hrs_conducted = ?
    WHERE student_id IN (
      SELECT student_id
      FROM students
      WHERE year_id = ?
        AND dept_id = ?
    )
      AND subject_id = (
        SELECT subject_id
        FROM subject
        WHERE subject = ?
      );
    `

    con.query(sql,[hrs_conducted,year_id, dept_id, subject],(error,result)=>{
        if(error) throw error;

        if (!result || result.length === 0) {
            // Handle case when no students are found
            res.render("attendance", { students: [], teacher: global.teacher, user: '' });
            console.log('no data -----------')
            return;
          }
          res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${slot}`);
          global.students = result;
          console.log( global.students);
          next();

    })
      req.session.hrs_conducted = hrs_conducted;

    }
    else{

    const totat_hrs_conducted =  parseInt(req.session.hrs_conducted )+parseInt(hrs_conducted);  
    global.totat_hrs_conducted = totat_hrs_conducted;
    console.log('totat_hrs_conducted : ',totat_hrs_conducted)
    const sql = `
    UPDATE attendance
    SET hrs_conducted = ?
    WHERE student_id IN (
      SELECT student_id
      FROM students
      WHERE year_id = ?
        AND dept_id = ?
    )
      AND subject_id = (
        SELECT subject_id
        FROM subject
        WHERE subject = ?
      );
    `

    con.query(sql,[totat_hrs_conducted,year_id, dept_id, subject],(error,result)=>{
        if(error) throw error;

        if (!result || result.length === 0) {
            // Handle case when no students are found
            res.render("attendance", { students: [], teacher: global.teacher, user: '' });
            console.log('no data -----------')
           return next();
          }
          res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${slot}`);
          global.students = result;
          console.log( global.students);

    })
    
    }
}
    

// exports.save_attendance = async (req, res, next) => {
//   const year_id = global.year_id;
//   const dept_id = global.dept_id;
//   const subject = global.subject;

//   const attendedHours = req.body.attendedHours;
//   const isSlot1 = global.slot === '1';

//   if (attendedHours && Object.keys(attendedHours).length > 0) {
//     // Update the 'No of Hours Attended' for each student
//     let isValid = true;

//     Object.entries(attendedHours).forEach(([index, hours]) => {
//       const student_id = global.students[index].student_id;
//       // Perform your validation logic here
//       if (parseInt(hours) < 1) {
//         isValid = false;
//       } else {
//         attendedHours[student_id] = hours;
//       }
//     });

//     if (isValid) {
//       Object.entries(attendedHours).forEach(([student_id, hours]) => {
//         const sql = `
//           UPDATE attendance
//           SET hrs_attended = hrs_attended + ?
//           WHERE student_id = ?
//           AND subject_id = (
//             SELECT subject_id
//             FROM subject
//             WHERE subject = ?
//           )
//           AND student_id IN (
//             SELECT student_id
//             FROM students
//             WHERE year_id = ?
//             AND dept_id = ?
//           );
//         `;

//         con.query(sql, [hours, student_id, subject, year_id, dept_id], (err, result) => {
//           if (err) throw err;
//           console.log(result);
//         });
//         req.session.slot1submitted =true;
//       });

//       if (isSlot1) {
//         req.session.attendanceSlot1 = attendedHours;
//       } else {
//         const attendanceSlot1 = req.session.attendanceSlot1 || {}; // Initialize attendanceSlot1 as an object
//         console.log('attendanceSlot1:', attendanceSlot1);

//         const combinedAttendance = {};

//         // Combine attendance from slot 1 and slot 2
//         Object.entries(attendedHours).forEach(([student_id, hours]) => {
//           const previousAttendance = attendanceSlot1[student_id] || 0;
//           const combinedHours = parseInt(previousAttendance) + parseInt(hours);
//           combinedAttendance[student_id] = combinedHours;
//         });

//         req.session.attendanceSlot2 = combinedAttendance;
//         console.log('combinedAttendance:', combinedAttendance);

//         // Update the 'No of Hours Attended' for each student in slot 2 in the database
//         Object.entries(combinedAttendance).forEach(([student_id, hours]) => {
//           const sql = `
//             UPDATE attendance
//             SET hrs_attended = ?
//             WHERE student_id = ?
//             AND subject_id = (
//               SELECT subject_id
//               FROM subject
//               WHERE subject = ?
//             )
//             AND student_id IN (
//               SELECT student_id
//               FROM students
//               WHERE year_id = ?
//               AND dept_id = ?
//             );
//           `;

//           con.query(sql, [hours, student_id, subject, year_id, dept_id], (err, result) => {
//             if (err) throw err;
//             console.log(result);
//           });
//         req.session.slot2submitted =true;

//         });
//       }

//       req.session.submitted = true; // Set the submitted flag in the session
//       res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${global.slot}`);
//     } else {
//       // Handle the validation error
//       req.session.error = true; // Set the error flag in the session
//       res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${global.slot}`);
//     }
//   } else {
//     res.send('error');
//   }
// };

exports.save_attendance = async (req, res, next) => {
  const year_id = global.year_id;
  const dept_id = global.dept_id;
  const subject = global.subject;

  const attendedHours = req.body.attendedHours;
  const isSlot1 = global.slot === '1';

  if (attendedHours && Object.keys(attendedHours).length > 0) {
    // Update the 'No of Hours Attended' and calculate percentage for each student
    let isValid = true;

    Object.entries(attendedHours).forEach(([index, hours]) => {
      const student_id = global.students[index].student_id;
      // Perform your validation logic here
      if (parseInt(hours) < 1) {
        isValid = false;
      } else {
        attendedHours[student_id] = hours;
      }
    });

    if (isValid) {
      if (isSlot1) {
      Object.entries(attendedHours).forEach(([student_id, hours]) => {

        const hrs_conducted = global.hrs_conducted 
        console.log('slot1 student_id: ',student_id)
        console.log('slot1 hours: ',hours)
        console.log('slot1 hrs_conducted: ',hrs_conducted)
        const percentage = ( parseInt(hours) / parseInt(hrs_conducted) * 100).toFixed(2);
        console.log('slot1 percentage: ',percentage)

        
        const sql = `
          UPDATE attendance
          SET hrs_attended =  ?,
              percentage = ?,
              submitted=TRUE
          WHERE student_id = ?
          AND subject_id = (
            SELECT subject_id
            FROM subject
            WHERE subject = ?
          )
          AND student_id IN (
            SELECT student_id
            FROM students
            WHERE year_id = ?
            AND dept_id = ?
          );
        `;

        con.query(sql, [hours, percentage, student_id, subject, year_id, dept_id], (err, result) => {
          if (err) throw err;
          console.log(result);
          next();

        }); 
         req.session.hrs_conducted = hrs_conducted;
        console.log('req.session.hrs_conducted : ',req.session.hrs_conducted );
        req.session.percentage = req.session.percentage || {};
        console.log('req.session.percentage : ',req.session.percentage ); // Initialize percentage object in req.session if it doesn't exist
        req.session.percentage[student_id] = percentage; // Store the percentage for the student in req.session
        req.session.slot1submitted = true;
       
      });

     
    
        req.session.attendanceSlot1 = attendedHours;
        console.log('req.session.attendanceSlot1: ',req.session.attendanceSlot1)

      }
       else {
        const attendanceSlot1 = req.session.attendanceSlot1 || {}; // Initialize attendanceSlot1 as an object
        console.log('attendanceSlot1:', attendanceSlot1);

        const combinedAttendance = {};

        // Combine attendance from slot 1 and slot 2
        Object.entries(attendedHours).forEach(([student_id, hours]) => {
          const previousAttendance = attendanceSlot1[student_id] || 0;
          const combinedHours = parseInt(previousAttendance) + parseInt(hours);
          combinedAttendance[student_id] = combinedHours;
        });

        req.session.attendanceSlot2 = combinedAttendance;
        console.log('combinedAttendance:', combinedAttendance);

        // Update the 'No of Hours Attended' and calculate percentage for each student in slot 2 in the database
        Object.entries(combinedAttendance).forEach(([student_id, hours]) => {
          const totat_hrs_conducted =  global.totat_hrs_conducted ;
          console.log('slot2 student_id: ',student_id)
          console.log('slot2 hours: ',hours)
          console.log('slot2 hrs_conducted: ',totat_hrs_conducted)
          const percentage =  (parseInt(hours) / parseInt(totat_hrs_conducted) * 100).toFixed(2);
          console.log('slot2  percentage: ',percentage)
          const sql = `
            UPDATE attendance
            SET hrs_attended =  ?,
                percentage = ?
            WHERE student_id = ?
            AND subject_id = (
              SELECT subject_id
              FROM subject
              WHERE subject = ?
            )
            AND student_id IN (
              SELECT student_id
              FROM students
              WHERE year_id = ?
              AND dept_id = ?
            );
          `;

          con.query(sql, [hours, percentage , student_id, subject, year_id, dept_id], (err, result) => {
            if (err) throw err;
            console.log(result);
          next();


          });
          req.session.slot2submitted = true;
        });

      }

      req.session.submitted = true; // Set the submitted flag in the session
      res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${global.slot}`);
    } else {
      // Handle the validation error
      req.session.error = true; // Set the error flag in the session
      res.redirect(`/${year_id}/${dept_id}/${subject}/attendance/${global.slot}`);
    }
  } else {
    res.send('error');
    next();

  }
};


exports.findattendance = async(req,res)=>{

    let searchterm = req.body.search

    sql="select * from students where firstname LIKE ?"

    con.query(sql,['%'+searchterm+'%'],(err,result)=>{
        if(err) throw err;
        console.log(result)
        res.render('attendance',{students: result , addedalert:"",deletealert:'',updatealert :''})
    })
}

//report page

exports.report = async(req,res)=>{

    sql='select * from students '
     con.query(sql,(error,result)=>{
        if(error) throw error;
        res.render('reports',{student:result})
     });
}

exports.findreport = async(req,res,next)=>{

    let searchterm = req.body.search

    sql="select * from students where firstname LIKE ?"

    con.query(sql,['%'+searchterm+'%'],(err,result)=>{
        if(err) throw err;
        console.log(result)
        res.render('reports',{student: result , addedalert:"",deletealert:'',updatealert :''})
    })
}


// faculty CURD operations

exports.addfaculty = async(req,res,next)=>{

    const {id,name,subject,username, password}=req.body;
    
    
    var sql = "INSERT INTO `teacher`(`id`, `name`, `subject`, `username`, `password`) VALUES ?"
    var values = [[id,name,subject, username, password]];

    con.query(sql,[values], (error, result) => {
            if(error) throw error;
            let facultyadded = encodeURIComponent('User added Successfully !')
            res.redirect('/faculty?facultyadded='+facultyadded)
        });

}

exports.findfaculty = async(req,res)=>{

    let searchterm = req.body.search

    sql="select * from teacher where name LIKE ?"

    con.query(sql,['%'+searchterm+'%'],(err,result)=>{
        if(err) throw err;
        res.render('faculty',{teacher: result , addedalert:"",deletealert:'',updatealert :''})
    })
}

exports.editfaculty = async(req,res,next)=>{

    var sql = "select * from teacher where id = ?"
    var values = [[req.params.id]];
    con.query(sql,[values], (error, result) => {
            if(error) throw error;
            res.render('edit-faculty',{teacher: result})
            console.log(result)
        });

}

exports.updatefaculty = async(req,res,next)=>{

    const {name,subject,username, password}=req.body;
    
    
    var sql = "update teacher set name=?, subject=?, username=?, password=? where id=?";

    con.query(sql,[name,subject, username, password, req.params.id], (error, result) => {
            if(error) throw error;

            let facultyupdated = encodeURIComponent('updated')


            res.redirect('/faculty?facultyupdated='+facultyupdated)
        });

}

exports.deletefaculty = async(req,res,next)=>{

    
    
    var sql = "delete from teacher where id = ?"
    var values = [[req.params.id]];
    con.query(sql,[values], (error, result) => {
            if(error) throw error;

            let facultyremoved = encodeURIComponent('removed')

            res.redirect('/faculty?facultyremoved='+facultyremoved)
            console.log(result)
        });

}


// student CURD operations


exports.studentdata= async(req,res,next)=>{
    
    con.query('SELECT * from students',(err,results)=>{
        if (err) {throw err};
            data = results
        console.log(req.data)

    } )
}


exports.addstudent = async(req,res,next)=>{

    const {id,regno,firstname,lastname, phoneno}=req.body;
    
    
    var sql = "INSERT INTO `students`(`id`, `regno`, `firstname`, `lastname`, `phoneno`) VALUES ?"
    var values = [[id,regno,firstname,lastname, phoneno]];

    con.query(sql,[values], (error, result) => {
            if(error) throw error;
            let studentadded = encodeURIComponent('User added Successfully !')
            res.redirect('/students?studentadded='+studentadded)
        });

}

exports.editstudent = async(req,res,next)=>{
    
    var sql = "select * from students where id = ?"
    var values = [[req.params.id]];
    con.query(sql,[values], (error, result) => {
            if(error) throw error;
            res.render('edit-student',{student: result})
            console.log(result)
        });

}

exports.updatestudent = async(req,res,next)=>{

    const {firstname,lastname,regno, phoneno}=req.body;
    
    
    var sql = "update students set firstname=?, lastname=?, regno=?, phoneno=? where id=?";

    con.query(sql,[firstname,lastname, regno, phoneno, req.params.id], (error, result) => {
            if(error) throw error;

            let studentupdated = encodeURIComponent('updated')


            res.redirect('/students?studentupdated='+studentupdated)
        });

}

exports.deletestudent = async(req,res,next)=>{

    
    
    var sql = "delete from students where id = ?"
    var values = [[req.params.id]];
    con.query(sql,[values], (error, result) => {
            if(error) throw error;

            let studentremoved = encodeURIComponent('removed')

            res.redirect('/students?studentremoved='+studentremoved)
            console.log(result)
        });

}

exports.findstudent = async(req,res,next)=>{

    let searchterm = req.body.search

    sql="select * from students where firstname LIKE ?"

    con.query(sql,['%'+searchterm+'%'],(err,result)=>{
        if(err) throw err;
        console.log(result)
        res.render('students',{student: result , addedalert:"",deletealert:'',updatealert :''})
    })
}
