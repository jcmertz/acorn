
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../src/db');

router.use(express.urlencoded({ extended: true }));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    const userRecord = await db.User.findOne({user:username});
    if(!(userRecord == null)){
        const storedPasswordBuffer = Buffer.from(userRecord.pass, 'hex');
        crypto.pbkdf2(password, userRecord.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(storedPasswordBuffer, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
            return cb(null, userRecord);
        });
    }else{
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

router.post('/register', async function(req, res, next) {
    try {
        const userRecord = await db.User.findOne({user:req.body.username});
        if(!(userRecord == null)){
            res.redirect('/register?invalidUsername=true');
            return;
        }
        const salt = crypto.randomBytes(16).toString('hex'); // Convert salt to hexadecimal
        crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', async function(err, hashedPassword) {
            if (err) { return next(err); }
            
            // Store hashedPassword and salt as strings
            const user = await db.User.create({
                user: req.body.username,
                pass: hashedPassword.toString('hex'), 
                salt: salt,
                role: "user"
            });
            
            // Create user object for login
            const loginUser = {
                id: user._id,
                user: req.body.username
            };
            // Create band object and store in database:
            const band = db.Band.create({
                bandName:req.body.bandName,
                contactEmail:req.body.contactEmail,
                homeTown:req.body.homeTown,
                genre:req.body.genre,
                instagram:req.body.instagram,
                loginInfo:user.user
            });

            // Log the user in
            req.login(loginUser, function(err) {
                if (err) { return next(err); }
                res.redirect('/');
            });
        });
    } catch (error) {
        next(error);
    }
});

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.user, role:user.role });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

// Route to get authentication status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            isAuthenticated: true, 
            isAdmin: req.user && req.user.role === 'admin' 
        });
    } else {
        res.json({ 
            isAuthenticated: false, 
            isAdmin: false 
        });
    }
});

module.exports = router;
