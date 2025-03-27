/**
 * Script to populate the database with test data
 * 
 * Run with: docker exec acorn-app node /app/scripts/populateTestData.js
 */

const mongoose = require('mongoose');
const db = require('../src/db');
const crypto = require('crypto');
const { promisify } = require('util');

// Promisify the callback-based pbkdf2
const pbkdf2Async = promisify(crypto.pbkdf2);

// Function to create a hashed password
async function createHashedPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await pbkdf2Async(password, salt, 310000, 32, 'sha256');
  return {
    pass: hashedPassword.toString('hex'),
    salt: salt
  };
}

// Function to create a user with specified roles
async function createUser(username, email, password, roles) {
  try {
    // Check if user already exists
    const existingUser = await db.User.findOne({ user: username });
    if (existingUser) {
      console.log(`User ${username} already exists, skipping creation`);
      return existingUser;
    }
    
    // Create password hash
    const passwordData = await createHashedPassword(password);
    
    // Create user
    const user = await db.User.create({
      user: username,
      email: email,
      roles: roles,
      pass: passwordData.pass,
      salt: passwordData.salt,
      email_verified: true
    });
    
    console.log(`Created user: ${username} with roles: ${roles.join(', ')}`);
    return user;
  } catch (error) {
    console.error(`Error creating user ${username}:`, error);
    throw error;
  }
}

// Function to create a band
async function createBand(bandName, genre, hometown, instagram, members) {
  try {
    // Check if band already exists
    const existingBand = await db.Band.findOne({ bandName: bandName });
    if (existingBand) {
      console.log(`Band ${bandName} already exists, skipping creation`);
      return existingBand;
    }
    
    // Create band
    const band = await db.Band.create({
      bandName: bandName,
      genre: genre,
      homeTown: hometown,
      instagram: instagram,
      bandMembers: members.map(member => member._id)
    });
    
    // Update each member's bands array
    for (const member of members) {
      member.bands = member.bands || [];
      member.bands.push(band._id);
      await member.save();
    }
    
    console.log(`Created band: ${bandName}`);
    return band;
  } catch (error) {
    console.error(`Error creating band ${bandName}:`, error);
    throw error;
  }
}

// Function to create a show
async function createShow(showName, showDate, bands, contact, ticketPrice, status) {
  try {
    // Create show
    const show = await db.Show.create({
      showName: showName,
      showDate: showDate,
      requestDate: new Date(),
      bands: bands.map(band => band._id),
      contact: contact._id,
      ticketPrice: ticketPrice,
      ticketsSold: 0,
      showStatus: status
    });
    
    console.log(`Created show: ${showName} on ${showDate.toLocaleDateString()}`);
    return show;
  } catch (error) {
    console.error(`Error creating show ${showName}:`, error);
    throw error;
  }
}

// Main function to populate test data
async function populateTestData() {
  try {
    console.log('Starting database population with test data...');
    
    // Create users with different roles
    const adminUser = await createUser('testadmin', 'admin@example.com', 'password123', ['admin', 'user']);
    const staffUser = await createUser('teststaff', 'staff@example.com', 'password123', ['staff', 'user']);
    const soundUser = await createUser('testsound', 'sound@example.com', 'password123', ['sound', 'user']);
    const doorUser = await createUser('testdoor', 'door@example.com', 'password123', ['door', 'user']);
    const promoterUser = await createUser('testpromoter', 'promoter@example.com', 'password123', ['promoter', 'user']);
    const regularUser = await createUser('testuser', 'user@example.com', 'password123', ['user']);
    
    // Create band members
    const bandMember1 = await createUser('bandmember1', 'band1@example.com', 'password123', ['user']);
    const bandMember2 = await createUser('bandmember2', 'band2@example.com', 'password123', ['user']);
    const bandMember3 = await createUser('bandmember3', 'band3@example.com', 'password123', ['user']);
    const bandMember4 = await createUser('bandmember4', 'band4@example.com', 'password123', ['user']);
    
    // Create bands
    const band1 = await createBand('The Test Pilots', 'Rock', 'Chicago', '@testpilots', [bandMember1, bandMember2]);
    const band2 = await createBand('Digital Nomads', 'Electronic', 'Detroit', '@digitalnomads', [bandMember3]);
    const band3 = await createBand('Midnight Coders', 'Indie', 'Milwaukee', '@midnightcoders', [bandMember4]);
    const band4 = await createBand('The Exceptions', 'Metal', 'Chicago', '@exceptions', [bandMember2, bandMember3]);
    
    // Create shows for the next few days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(21, 0, 0, 0);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(19, 30, 0, 0);
    
    // Create shows with different statuses
    const show1 = await createShow('Rock Night', tomorrow, [band1, band2], adminUser, 15, 2); // Confirmed
    const show2 = await createShow('Electronic Fusion', dayAfterTomorrow, [band2, band3], staffUser, 12, 1); // In Negotiation
    const show3 = await createShow('Metal Mayhem', nextWeek, [band4, band1], promoterUser, 20, 0); // Submitted
    
    console.log('Database population complete!');
    console.log('Summary:');
    console.log(`- Created 10 users with various roles`);
    console.log(`- Created 4 bands`);
    console.log(`- Created 3 shows with different statuses`);
    
  } catch (error) {
    console.error('Error populating test data:', error);
  }
}

// Run the population function
populateTestData(); 