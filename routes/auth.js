var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var MagicLinkStrategy = require('passport-magic-link').Strategy;
var crypto = require('crypto');
var db = require('../src/db');
const jwt = require('jsonwebtoken');


router.use(express.urlencoded({ extended: true }));

const { sendMagicLink, sendToken,registerBand, transporter } = require('../src/utilities');
const { register } = require('module');


// Local Strategy for password-based login
passport.use(new LocalStrategy(async function verify(username, password, cb) {
    try {
        const userRecord = await db.User.findOne({ user: username });
        if (!userRecord) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }
        
        const storedPasswordBuffer = Buffer.from(userRecord.pass, 'hex');
        crypto.pbkdf2(password, userRecord.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(storedPasswordBuffer, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
            return cb(null, userRecord);
        });
    } catch (err) {
        return cb(err);
    }
}));

// MagicLink Strategy for email-based login
passport.use(new MagicLinkStrategy(
    {
        secret: process.env.MAGIC_LINK_SECRET,   // Secret for token generation
        userFields: ['email'],                   // Field to verify user
        tokenField: 'token',                     // Field where token is saved
        verifyUserAfterToken: true,              // Whether to verify user after token is generated
        passReqToCallback: true
    },
    sendToken
    ,
    async function verify(user) {
        try {
            
            // Check if the user exists in the database by their email
            let userRecord = await db.User.findOne({ email: user.email });
            
            // If the user doesn't exist, throw an error
            if (!userRecord) {
                throw new Error('No known user with this email address.');
            }
            
            // If the user exists, return the user object
            return {
                id: userRecord._id,
                email: userRecord.email,
                user: userRecord.user,
                role: userRecord.role
            };
        } catch (err) {
            // Handle any unexpected errors
            throw err;
        }
    }
));

// Routes
router.get('/login', function(req, res) {
    res.render('login/password');
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login/',
    failureMessage: true
}));

router.post('/login/email', passport.authenticate('magiclink', {
    action: 'requestToken',
    failureRedirect: '/login',
    failureFlash: true // Enable failure flash messages
}), function(req, res) {
    res.redirect('/login/email/check');
});

router.get('/login/email/check', function(req, res) {
    req.flash("success","Check your email for a login link!");
    res.redirect('/',);
});
router.get('/login/email/verify', async (req,res) =>{
    // console.log("Query:");
    // console.log(req.query);
    const { token, email } = req.query;
    
    try{
        const decoded = jwt.verify(token, process.env.MAGIC_LINK_SECRET);
        // If token is valid, proceed with the authentication
        passport.authenticate('magiclink', { failureRedirect: '/login' })(req, res, () => {
            req.flash('success', 'Logged In');
            res.redirect('/');
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            // Token is expired, handle token regeneration 
            //console.log('Token expired. Generating new token...');
            const expired = jwt.verify(token, process.env.MAGIC_LINK_SECRET, {ignoreExpiration: true} );
            sendMagicLink(expired.user);
            req.flash('error', 'Token Expired: A New Link Has Been Sent to your E-Mail'); 
            res.redirect('/');
        }
    }
});

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Registration route
router.get('/register', function(req, res) {
    res.render('register', {
        errorMessages:res.locals.errorMessages,
        successMessages:res.locals.successMessages
    });
});

router.post('/register', async function(req, res, next) {
    try {
        const userRecord = await db.User.findOne({ user: req.body.username });
        const bandRecord = await db.Band.findOne({ bandName: req.body.bandName });
        
        var redirect = false;
        if (userRecord) {
            req.flash("error","That Username is Already Registered");
            redirect = true;
        }
        if (bandRecord) {
            req.flash("error","That Band Name Is Already Registered");
            redirect = true;
        }
        if(redirect){
            res.redirect('/register');
            return;
        }
        
        const loginUser = await registerBand(req.body.contactEmail,req.body.username,req.body.password);
        
        band = await db.Band.findOneAndUpdate({ bandName: loginUser.user },{instagram:req.body.instagram});        
        
        req.login(loginUser, function(err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
        
    } catch (error) {
        next(error);
    }
});

// Passport session setup
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.user, role: user.role });
    });
});

passport.deserializeUser(async function(user, cb) {
    try {
        const userRecord = await db.User.findById(user.id);
        if (!userRecord) {
            return cb(null, false);
        }
        
        cb(null, {
            id: userRecord._id,
            username: userRecord.user,
            role: userRecord.role,
            email: userRecord.email
        });
    } catch (err) {
        cb(err);
    }
});

module.exports = router;
