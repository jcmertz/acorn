/**
 * Script to fix admin user roles
 * 
 * Run with: docker exec acorn-app node /app/scripts/fixAdminRoles.js
 */

const db = require('../src/db');

async function fixAdminRoles() {
  try {
    console.log('Starting admin role fix...');

    // Find the admin user
    const adminUser = await db.User.findOne({ user: 'admin' });
    
    if (!adminUser) {
      console.error('Admin user not found!');
      return;
    }
    
    console.log(`Found admin user: ${adminUser.user}`);
    console.log(`Current roles: ${JSON.stringify(adminUser.roles || [])}`);
    
    // Ensure roles is an array
    if (!adminUser.roles || !Array.isArray(adminUser.roles)) {
      adminUser.roles = [];
    }
    
    // Add admin role if not present
    if (!adminUser.roles.includes('admin')) {
      adminUser.roles.push('admin');
      await adminUser.save();
      console.log(`Updated admin user roles to: ${JSON.stringify(adminUser.roles)}`);
    } else {
      console.log('Admin role already exists for this user, no update needed.');
    }
    
    console.log('Admin role fix complete.');
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixAdminRoles(); 