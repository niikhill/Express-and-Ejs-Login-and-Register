if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}
const express = require('express')
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./passport-config');
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const users = [];

initializePassport(passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

app.set('view engine', 'ejs');
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuth, (req, res) => {
    res.render('index.ejs', {
        name: req.user.name
    })
})
app.use(express.urlencoded({
    extended: false
}))
app.get('/login', (req, res) => {
    res.render('login.ejs');
});
app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
})

app.get("/register", notAuth, (req, res) => {
    res.render("register.ejs");
})

app.post("/register", notAuth, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login');
    } catch {
        res.redirect('/register')
    }
    console.log(users);
})
app.post("/login", notAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
}))

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function notAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}
app.listen(3000);