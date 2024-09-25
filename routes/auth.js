
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../src/db');

router.use(express.urlencoded({ extended: true }));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const userRecord = await db.User.findOne({ user: username });
    if (userRecord) {
        const storedPasswordBuffer = Buffer.from(userRecord.pass, 'hex');
        crypto.pbkdf2(password, userRecord.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(storedPasswordBuffer, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
            return cb(null, userRecord);
        });
    } else {
        return cb(null, false, { message: 'Incorrect username or password.' });
    }
}));

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Route to get authentication status
router.get('/status', (req, res) => {
    console.log("Auth status requested");
    if (req.isAuthenticated()) {
        console.log("User is authenticated");
        res.json({
            isAuthenticated: true,
            isAdmin: req.user && req.user.role === 'admin'
        });
    } else {
        console.log("User is not authenticated");
        res.json({
            isAuthenticated: false,
            isAdmin: false
        });
    }
});

module.exports = router;
