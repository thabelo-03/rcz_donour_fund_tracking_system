const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
    try {
        await connectDB();
        console.log('🔍 Checking for existing admin user...');

        const email = 'admin@rcz.org.zw';
        const plainPassword = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const adminData = {
            name: 'Rev. Tapiwa Moyo',
            email: email,
            password: hashedPassword,
            role: 'admin',
            department: 'Administration',
            congregation: 'Head Office',
        };

        // Upsert means it will update if the email exists, or insert if it doesn't
        await User.findOneAndUpdate({ email: email }, { $set: adminData }, { new: true, upsert: true });

        console.log(`✅ Admin user seeded/reset successfully!`);
        console.log(`📧 Email: ${email}\n🔑 Password: ${plainPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed admin:', error);
        process.exit(1);
    }
};

seedAdmin();