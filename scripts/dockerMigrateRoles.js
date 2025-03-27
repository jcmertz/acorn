/**
 * Migration script to convert single role field to roles array
 * 
 * Run with: docker exec acorn-app node /app/scripts/dockerMigrateRoles.js
 */

const db = require('../src/db');

async function migrateRoles() {
  try {
    console.log('Starting migration of user roles...');

    // Find all users with the old schema (role field)
    const users = await db.User.find({ role: { $exists: true } });
    console.log(`Found ${users.length} users with old role schema`);

    // Update each user
    let updated = 0;
    for (const user of users) {
      // Skip users that already have roles array
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        console.log(`User ${user.user} already has roles array, skipping`);
        continue;
      }

      // Convert single role to roles array
      user.roles = user.role ? [user.role] : ['user'];
      await user.save();
      updated++;
      console.log(`Migrated user ${user.user} from role "${user.role}" to roles ${JSON.stringify(user.roles)}`);
    }

    console.log(`Migration complete. Updated ${updated} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateRoles(); 