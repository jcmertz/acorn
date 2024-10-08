var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var MagicLinkStrategy = require('passport-magic-link').Strategy;
var crypto = require('crypto');
var db = require('../src/db');

router.use(express.urlencoded({ extended: true }));

const { transporter } = require('../app');  // Bring in the nodemailer object


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

passport.use(new MagicLinkStrategy(
    {
        secret: process.env.MAGIC_LINK_SECRET,     // For token generation
        userFields: ['email'],           // User field to send email
        tokenField: 'token',             // Field where token is saved
        verifyUserAfterToken: true      // Verify user after token generated
    }, 
    function send (user, token) {
        const magicLinkUrl = 'http://acorn.thefallenlog.com/login/email/verify?token=' + token;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Your Magic Login Link',
            text: `Click this link to log in: ${magicLinkUrl}`,
        };
        return transporter.sendMail(mailOptions);
    }, 
    function verify (user) {
        return new Promise(async function(resolve, reject) {
            try{
                // 1. Check if the user exists in the database by their email
                let userRecord =  await db.User.findOne({email:user.email});
                // 2. If the user doesn't exist, insert a new one
                if(!userRecord){
                    const newUser = new db.User({
                        email:user.email,
                        email_verified: true
                    });
                    // Save the new user to the database
                    let savedUser = await newUser.save();
                    // Return the newly created user's info
                    resolve({
                        id: savedUser._id, 
                        email: savedUser.email
                    });
                } else {
                    // 3. If the user exists, return the found user
                    resolve({
                        id: userRecord._id,
                        email: userRecord.email
                    });
                }
            } catch (err) {
                // If there's an error (e.g., DB issue), reject the promise
                reject(err);
            }
        });
    }
));

router.get('/login', function(req, res, next) {
    res.render('login/email');
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login/'
}));

router.post('/login/email', passport.authenticate('magiclink', {
    action: 'requestToken',
    failureRedirect: '/login'
}), function(req, res, next) {
    res.redirect('/login/email/check');
});

router.get('/login/email/check', function(req, res, next) {
    res.render('login/email/check');
});

router.get('/login/email/verify', passport.authenticate('magiclink', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/register', function(req, res, next) {
    res.render('register',{
        invalidUsername:req.query.invalidUsername,
        invalidBandname:req.query.invalidBandname
    });
});

router.post('/register', async function(req, res, next) {
    try {
        const userRecord = await db.User.findOne({user:req.body.username});
        const bandRecord = await db.Band.findOne({bandName:req.body.bandName});
        if(!(userRecord == null)){
            res.redirect('/register?invalidUsername=true');
            return;
        }
        if(!(bandRecord == null)){
            res.redirect('/register?invalidBandname=true');
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
                role: "user",
                email: req.body.contactEmail
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

module.exports = router;