var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var MagicLinkStrategy = require('passport-magic-link').Strategy;
var crypto = require('crypto');
var db = require('../src/db');

router.use(express.urlencoded({ extended: true }));

const { transporter } = require('../app');  // Bring in the nodemailer object

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
        verifyUserAfterToken: true               // Whether to verify user after token is generated
    },
    async function send(user, token) {
        const magicLinkUrl = `http://acorn.thefallenlog.com/login/email/verify?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Your Magic Login Link',
            text: `Click this link to log in: ${magicLinkUrl}`,
        };
        return transporter.sendMail(mailOptions);
    },
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
    res.render('login/email');
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
    res.redirect('/',);
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

// Registration route
router.get('/register', function(req, res) {
    res.render('register', {
        invalidUsername: req.query.invalidUsername,
        invalidBandname: req.query.invalidBandname
    });
});

router.post('/register', async function(req, res, next) {
    try {
        const userRecord = await db.User.findOne({ user: req.body.username });
        const bandRecord = await db.Band.findOne({ bandName: req.body.bandName });
        
        if (userRecord) {
            res.redirect('/register?invalidUsername=true');
            return;
        }
        if (bandRecord) {
            res.redirect('/register?invalidBandname=true');
            return;
        }
        
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', async function(err, hashedPassword) {
            if (err) { return next(err); }
            
            const user = await db.User.create({
                user: req.body.username,
                pass: hashedPassword.toString('hex'),
                salt: salt,
                role: "user",
                email: req.body.contactEmail
            });
            
            const loginUser = { id: user._id, user: user.user };
            
            await db.Band.create({
                bandName: req.body.bandName,
                contactEmail: req.body.contactEmail,
                homeTown: req.body.homeTown,
                genre: req.body.genre,
                instagram: req.body.instagram,
                loginInfo: user.user
            });
            
            req.login(loginUser, function(err) {
                if (err) { return next(err); }
                res.redirect('/');
            });
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
