const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');

const exphbs = require('express-handlebars');

const bcrypt = require('bcrypt-nodejs');
const saltRounds = 2;

const bodyParser = require('body-parser');

var session_email = "";
var session_hash;

var user_logged_in = false;
user_auth = function(user_logged_in, res) {
    if (!user_logged_in) {
        res.redirect('/login');
    }
}

app.use(bodyParser.urlencoded({extended: true}));

/* STATIC FILES LOCATION */
app.use(express.static(path.join(__dirname + '/public')))

/* SET UP HANDLEBARS */
exphbs({layoutsDir: path.join(__dirname + '/public')});
const hbs = exphbs.create({layoutsDir: path.join(__dirname + '/public')});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname + '/public/'));

/* MySQL Connection */
const mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "campus2corp",
    password: "localrootpass"
})
con.connect(function(err){
    if (err) throw err;
    console.log("Connection established!");
})


/* ROUTES */
app.get('/', function(req, res) {
//    res.sendFile(path.join(__dirname + '/public/index.html'))
})
app.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/test.html'));
})
app.get('/hbs-test', function(req, res){
    var someData = "HEY IM SOME DDATA";
    var coolCompanyname = "facebook";
    res.render('page/page', {
        helpers: {
            data: function(){
                return someData;
            },
            myCompanyName: function(){
                return coolCompanyname;
            }
        }
    })
})

/* API ROUTES */
// Returns all users
app.get('/api/users', function(req, res){
    user_auth(user_logged_in, res);
    con.query('select * from users;', function(err, result){
        if (err) throw err;
        res.json({data: result});
    });
})
// Returns a single user
app.get('/api/users/:id', function(req, res){
    user_auth(user_logged_in, res);
    // con.query('select * from users where id =' + req.params.id + ';', function(err, result){
    con.query('select id, name, city, state, school, stage from users where id =' + req.params.id + ';', function(err, result){
        if (err) throw err;
        res.json({data: result});
    })
})
// create user
app.post('/api/users', function(req, res){
    var email = req.param('email') || null;
    var name = req.param('name') || null;
    var city = req.param('city') || null;
    var state = req.param('state') || null;
    var school = req.param('school') || null;
    var company = req.param('company') || null;
    var company_city = req.param('company_city') || null;
    var company_state = req.param('company_state') || null;
    var stage = req.param('stage') || null;

    var params = {
        email: email,
        name: name,
        city: city,
        state: state,
        school: school,
        company: company,
        company_city: company_city,
        company_state: company_state,
        stage: stage
    };

    con.query('insert into users set ?', params, function(err, results, fields){
        if (err) throw err;
        console.log("SUCCESSFULLY ADDED USER");
        res.json({data: params});
    })
})
// update user
app.put('/api/users', function(req, res){
    user_auth(user_logged_in, res);
    res.json({data: 'put request on user'});
})
app.get('/register', function(req, res) {
    // res.sendFile(path.join(__dirname + '/public/Registration/setup.html'))
    res.sendFile(path.join(__dirname + '/public/setup/setup.html'))
})
app.post('/register', function(req, res){
    var valueObj = req.body;
    var hashedPass = "";
    for (var obj in valueObj) {
        if (valueObj[obj] == '') {
            valueObj[obj] = null;
        }
    }

    hashedPass = bcrypt.hashSync(valueObj['password']);
    session_hash = hashedPass;
    session_email = ""
    valueObj['password'] = hashedPass;

    con.query('insert into users set ?', req.body, function(err, results){
        if (err) throw err;
        console.log("SUCCESSFULLY ADDED USER");
        res.redirect('/profile');
    });
    // res.redirect('/');
})

app.get('/profile', function(req, res) {
    user_auth(user_logged_in, res);
    res.sendFile(path.join(__dirname + '/public/profile/profile.html'))
})

app.get('/login', function(req, res) {
    // res.sendFile(path.join(__dirname + '/public/login/loginpage.html'))
    res.render('login/loginpage', {
        helpers: {
            incorrect_pass: function(){
                return "none";
            },
            incorrect_email: function(){
                return "none";
            }
        }
    })
})
app.post('/login', function(req, res){
    var email = req.body.email;
    var pass = req.body.password;

    // check if email exists and if the password matches the bashed pass
    con.query('select * from users where email = ?', email, function(err, result){
        if (err) throw err;
        if (result.length == 0){
            console.log("No Results");
            res.render('login/loginpage', {
                helpers: {
                    incorrect_pass: function() {
                        return "none";
                    },
                    incorrect_email: function(){
                        return "block";
                    }
                }
            })
        } else {
            // check password
            if (bcrypt.compareSync(pass, result[0].password) == true){
                console.log("Successfully logging in: " + result[0]);
                user_logged_in = true;
                res.redirect('/profile');
            } else {
                console.log("INCORRECT PASSWORD");
                res.render('login/loginpage', {
                    helpers: {
                        incorrect_pass: function(){
                            return "block";
                        },
                        incorrect_email: function(){
                            return "none";
                        }
                    }
                })
            } // end hash compare
        }
    }) // end con.query
}) // post /login

/* LAUNCH THE SERVER */
app.listen(3000, function() {
    console.log('Listening on 3000');
})
