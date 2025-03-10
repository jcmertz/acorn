var express = require('express');
var bands = require('./bands.js');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

const { sendMagicLink, updatePassword, registerUser } = require('../src/utilities');  // Bring in the nodemailer object


var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");
const { loadGetInitialProps } = require('next/dist/shared/lib/utils.js');

module.exports = function(io) {
    
    router.use(express.urlencoded({ extended: true }));
    
    router.get('/', async (req, res) => {
        let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
        console.log(userRecord);
        sendMagicLink(userRecord);
        res.render('login/checkEmail');
    });
    
    // User Management Routes
    router.get('/users', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const role = req.query.role || 'all';
            
            // Build query based on filters
            let query = {};
            
            // Search filter
            if (search) {
                query = {
                    $or: [
                        { user: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            
            // Role filter
            if (role && role !== 'all') {
                // Handle both old schema (role field) and new schema (roles array)
                query.$or = [
                    { roles: role },  // New schema: match if role is in the roles array
                    { role: role }    // Old schema: match if role field equals the role
                ];
            }
            
            // Count total users matching the query
            const totalUsers = await db.User.countDocuments(query);
            const totalPages = Math.ceil(totalUsers / limit);
            
            // Get users for current page
            const users = await db.User.find(query)
                .sort({ user: 1 })
                .skip((page - 1) * limit)
                .limit(limit);
            
            res.render('manageUsers', {
                users: users,
                userName: req.user.username,
                isLoggedIn: req.isAuthenticated(),
                userRole: req.user.role,
                userRoles: req.user.roles || [req.user.role || 'user'],
                errorMessages: res.locals.errorMessages,
                successMessages: res.locals.successMessages,
                pagination: {
                    page,
                    limit,
                    totalUsers,
                    totalPages
                },
                filters: {
                    search,
                    role
                }
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            req.flash('error', 'Failed to fetch users');
            res.redirect('/admin');
        }
    });

    // Add new user
    router.post('/users/add', async (req, res) => {
        try {
            const { username, email, roles, password } = req.body;
            
            // Check if user already exists
            const existingUser = await db.User.findOne({ user: username });
            if (existingUser) {
                req.flash('error', 'Username already exists');
                return res.redirect('/admin/users');
            }
            
            // Create new user
            await registerUser(email, username, password);
            
            // Update roles if provided
            if (roles && (Array.isArray(roles) || typeof roles === 'string')) {
                const newUser = await db.User.findOne({ user: username });
                
                // Handle both array and single string cases
                if (Array.isArray(roles)) {
                    newUser.roles = roles.length > 0 ? roles : ['user']; // Default to user if empty
                } else {
                    newUser.roles = [roles]; // Convert single role to array
                }
                
                await newUser.save();
            }
            
            req.flash('success', 'User added successfully');
            res.redirect('/admin/users');
        } catch (err) {
            console.error('Error adding user:', err);
            req.flash('error', 'Failed to add user');
            res.redirect('/admin/users');
        }
    });

    // Update user
    router.post('/users/update/:id', async (req, res) => {
        try {
            const userId = req.params.id;
            const { email, roles } = req.body;
            
            const user = await db.User.findById(userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/admin/users');
            }
            
            // Update user details
            user.email = email;
            
            // Handle roles update
            if (roles) {
                if (Array.isArray(roles)) {
                    user.roles = roles.length > 0 ? roles : ['user']; // Default to user if empty
                } else {
                    user.roles = [roles]; // Convert single role to array
                }
            } else {
                user.roles = ['user']; // Default to user if no roles provided
            }
            
            await user.save();
            
            req.flash('success', 'User updated successfully');
            res.redirect('/admin/users');
        } catch (err) {
            console.error('Error updating user:', err);
            req.flash('error', 'Failed to update user');
            res.redirect('/admin/users');
        }
    });

    // Reset password
    router.post('/users/reset-password/:id', async (req, res) => {
        try {
            const userId = req.params.id;
            const { password } = req.body;
            
            if (!password || password.length < 6) {
                req.flash('error', 'Password must be at least 6 characters');
                return res.redirect('/admin/users');
            }
            
            await updatePassword(userId, password);
            
            req.flash('success', 'Password reset successfully');
            res.redirect('/admin/users');
        } catch (err) {
            console.error('Error resetting password:', err);
            req.flash('error', 'Failed to reset password');
            res.redirect('/admin/users');
        }
    });

    // Delete user
    router.post('/users/delete/:id', async (req, res) => {
        try {
            const userId = req.params.id;
            
            // Check if user exists
            const user = await db.User.findById(userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/admin/users');
            }
            
            // Don't allow deleting the last admin
            if (user.role === 'admin') {
                const adminCount = await db.User.countDocuments({ role: 'admin' });
                if (adminCount <= 1) {
                    req.flash('error', 'Cannot delete the last admin user');
                    return res.redirect('/admin/users');
                }
            }
            
            // Delete user
            await db.User.findByIdAndDelete(userId);
            
            req.flash('success', 'User deleted successfully');
            res.redirect('/admin/users');
        } catch (err) {
            console.error('Error deleting user:', err);
            req.flash('error', 'Failed to delete user');
            res.redirect('/admin/users');
        }
    });
    
    return router;
};