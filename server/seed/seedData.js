const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Donor = require('../models/Donor');
const Grant = require('../models/Grant');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Donor.deleteMany({});
    await Grant.deleteMany({});
    await Transaction.deleteMany({});
    await AuditLog.deleteMany({});

    // Create Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      { name: 'Rev. Tapiwa Moyo', email: 'admin@rcz.org.zw', password, role: 'admin', department: 'Administration', congregation: 'Head Office' },
      { name: 'Grace Chikwanha', email: 'finance@rcz.org.zw', password, role: 'finance_officer', department: 'Finance', congregation: 'Head Office' },
      { name: 'James Mudenda', email: 'treasurer@rcz.org.zw', password, role: 'treasurer', department: 'Finance', congregation: 'Harare Central' },
      { name: 'Sarah Ncube', email: 'auditor@rcz.org.zw', password, role: 'auditor', department: 'Internal Audit', congregation: 'Head Office' },
      { name: 'Peter Banda', email: 'projects@rcz.org.zw', password, role: 'project_manager', department: 'Projects', congregation: 'Masvingo' }
    ]);
    console.log(`✅ ${users.length} users created`);

    // Create Donors
    const donors = await Donor.insertMany([
      {
        name: 'Dutch Reformed Church (DRC)', type: 'Faith-Based', email: 'partnerships@drc.nl',
        country: 'Netherlands', contactPerson: 'Dr. Jan van der Berg', totalDonated: 245000,
        totalGrants: 4, activeGrants: 2, confidenceScore: 92, status: 'Active',
        communications: [
          { subject: 'Q4 2024 Report Submitted', message: 'Report accepted with commendation', type: 'Report', date: new Date('2025-01-15') },
          { subject: 'Partnership Meeting', message: 'Discussed 2025 priorities', type: 'Meeting', date: new Date('2025-02-10') }
        ]
      },
      {
        name: 'USAID Zimbabwe', type: 'International', email: 'grants@usaid.gov',
        country: 'United States', contactPerson: 'Jennifer Smith', totalDonated: 180000,
        totalGrants: 2, activeGrants: 1, confidenceScore: 88, status: 'Active',
        communications: [
          { subject: 'Compliance Audit', message: 'Scheduled for March 2025', type: 'Email', date: new Date('2025-02-20') }
        ]
      },
      {
        name: 'World Council of Churches', type: 'Faith-Based', email: 'grants@wcc-coe.org',
        country: 'Switzerland', contactPerson: 'Rev. Maria Santos', totalDonated: 135000,
        totalGrants: 3, activeGrants: 2, confidenceScore: 85, status: 'Active'
      },
      {
        name: 'UNICEF Zimbabwe', type: 'International', email: 'harare@unicef.org',
        country: 'Zimbabwe', contactPerson: 'Dr. Agnes Mahlangu', totalDonated: 95000,
        totalGrants: 2, activeGrants: 1, confidenceScore: 90, status: 'Active'
      },
      {
        name: 'Bread for the World', type: 'NGO', email: 'africa@bread.org',
        country: 'Germany', contactPerson: 'Hans Mueller', totalDonated: 75000,
        totalGrants: 2, activeGrants: 1, confidenceScore: 82, status: 'Active'
      },
      {
        name: 'Harare Congregational Fund', type: 'Local', email: 'harare@rcz.org.zw',
        country: 'Zimbabwe', contactPerson: 'Elder Tendai Chirwa', totalDonated: 28000,
        totalGrants: 1, activeGrants: 1, confidenceScore: 78, status: 'Active'
      },
      {
        name: 'Christian Aid UK', type: 'NGO', email: 'partnerships@christianaid.org',
        country: 'United Kingdom', contactPerson: 'David Thompson', totalDonated: 62000,
        totalGrants: 1, activeGrants: 0, confidenceScore: 70, status: 'Inactive'
      }
    ]);
    console.log(`✅ ${donors.length} donors created`);

    // Create Grants
    const grants = await Grant.insertMany([
      {
        title: 'Primary School Infrastructure Upgrade', donor: donors[0]._id, grantNumber: 'GRT-2024-0001',
        description: 'Upgrading classrooms and facilities across 5 RCZ primary schools', category: 'Education',
        totalAmount: 85000, amountDisbursed: 65000, amountSpent: 52000, amountRemaining: 33000,
        fundType: 'Restricted', status: 'Active', startDate: new Date('2024-03-01'),
        endDate: new Date('2025-12-31'), reportingFrequency: 'Quarterly',
        nextReportDue: new Date('2025-06-30'), projectManager: 'Peter Banda',
        congregation: 'Multiple', conditions: 'Funds restricted to infrastructure only',
        milestones: [
          { title: 'Phase 1: Assessment', status: 'Completed', completedDate: new Date('2024-05-15'), amountAllocated: 5000, amountSpent: 4800 },
          { title: 'Phase 2: Construction Begins', status: 'Completed', completedDate: new Date('2024-09-01'), amountAllocated: 40000, amountSpent: 38000 },
          { title: 'Phase 3: Equipment Installation', status: 'In Progress', dueDate: new Date('2025-06-30'), amountAllocated: 25000, amountSpent: 9200 },
          { title: 'Phase 4: Final Inspection', status: 'Pending', dueDate: new Date('2025-10-31'), amountAllocated: 15000, amountSpent: 0 }
        ],
        complianceChecklist: [
          { item: 'Budget approved by donor', completed: true, completedDate: new Date('2024-02-15') },
          { item: 'Quarterly reports submitted', completed: true, completedDate: new Date('2025-03-31') },
          { item: 'Mid-term evaluation completed', completed: false },
          { item: 'Final audit scheduled', completed: false }
        ]
      },
      {
        title: 'Community Health Outreach Program', donor: donors[1]._id, grantNumber: 'GRT-2024-0002',
        description: 'Mobile health clinics serving rural communities in Masvingo and Manicaland',
        category: 'Health', totalAmount: 120000, amountDisbursed: 90000, amountSpent: 78000,
        amountRemaining: 42000, fundType: 'Restricted', status: 'Active',
        startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31'),
        reportingFrequency: 'Quarterly', nextReportDue: new Date('2025-06-30'),
        projectManager: 'Peter Banda', congregation: 'Masvingo',
        milestones: [
          { title: 'Clinic Setup', status: 'Completed', completedDate: new Date('2024-03-01'), amountAllocated: 30000, amountSpent: 28000 },
          { title: 'First 6 Months Operations', status: 'Completed', completedDate: new Date('2024-09-30'), amountAllocated: 45000, amountSpent: 43000 },
          { title: 'Year 2 Operations', status: 'In Progress', dueDate: new Date('2025-09-30'), amountAllocated: 45000, amountSpent: 7000 }
        ]
      },
      {
        title: 'Emergency Drought Relief Fund', donor: donors[2]._id, grantNumber: 'GRT-2025-0003',
        description: 'Food and water distribution to drought-affected communities',
        category: 'Humanitarian Relief', totalAmount: 55000, amountDisbursed: 55000,
        amountSpent: 42000, amountRemaining: 13000, fundType: 'Restricted', status: 'Active',
        startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'),
        reportingFrequency: 'Monthly', nextReportDue: new Date('2025-05-31'),
        projectManager: 'Grace Chikwanha', congregation: 'Chivhu',
        milestones: [
          { title: 'Needs Assessment', status: 'Completed', completedDate: new Date('2025-01-15'), amountAllocated: 5000, amountSpent: 4500 },
          { title: 'Food Distribution Phase 1', status: 'Completed', completedDate: new Date('2025-03-15'), amountAllocated: 25000, amountSpent: 24000 },
          { title: 'Food Distribution Phase 2', status: 'In Progress', dueDate: new Date('2025-05-31'), amountAllocated: 25000, amountSpent: 13500 }
        ]
      },
      {
        title: 'RCZ Hospital Equipment Modernization', donor: donors[3]._id, grantNumber: 'GRT-2024-0004',
        description: 'Medical equipment upgrade for Morgenster and Gutu hospitals',
        category: 'Health', totalAmount: 95000, amountDisbursed: 60000, amountSpent: 55000,
        amountRemaining: 40000, fundType: 'Restricted', status: 'Active',
        startDate: new Date('2024-06-01'), endDate: new Date('2026-05-31'),
        reportingFrequency: 'Semi-Annual', nextReportDue: new Date('2025-06-30'),
        projectManager: 'James Mudenda', congregation: 'Masvingo'
      },
      {
        title: 'Youth Skills Development Initiative', donor: donors[4]._id, grantNumber: 'GRT-2024-0005',
        description: 'Vocational training for 200 youth across RCZ congregations',
        category: 'Community Development', totalAmount: 45000, amountDisbursed: 30000,
        amountSpent: 25000, amountRemaining: 20000, fundType: 'Restricted', status: 'Active',
        startDate: new Date('2024-09-01'), endDate: new Date('2025-08-31'),
        reportingFrequency: 'Quarterly', nextReportDue: new Date('2025-06-30'),
        projectManager: 'Peter Banda', congregation: 'Gweru'
      },
      {
        title: 'Church Administration Capacity Building', donor: donors[0]._id, grantNumber: 'GRT-2025-0006',
        description: 'Training church administrators in financial management and governance',
        category: 'Capacity Building', totalAmount: 32000, amountDisbursed: 15000,
        amountSpent: 12000, amountRemaining: 20000, fundType: 'Temporarily Restricted',
        status: 'Active', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'),
        reportingFrequency: 'Quarterly', nextReportDue: new Date('2025-06-30'),
        projectManager: 'Grace Chikwanha', congregation: 'Head Office'
      },
      {
        title: 'Water and Sanitation Project (Completed)', donor: donors[6]._id, grantNumber: 'GRT-2023-0007',
        description: 'Borehole drilling and sanitation facilities at 3 RCZ schools',
        category: 'Infrastructure', totalAmount: 62000, amountDisbursed: 62000,
        amountSpent: 58500, amountRemaining: 3500, fundType: 'Restricted', status: 'Closed',
        startDate: new Date('2023-01-01'), endDate: new Date('2024-06-30'),
        reportingFrequency: 'Quarterly', projectManager: 'Peter Banda', congregation: 'Chipinge'
      }
    ]);
    console.log(`✅ ${grants.length} grants created`);

    // Create Transactions
    const now = new Date();
    const transactions = [];
    const types = ['Donation Received', 'Grant Disbursement', 'Expenditure'];
    const categories = ['Education', 'Health', 'Humanitarian Relief', 'Community Development', 'Infrastructure', 'Administrative'];
    const methods = ['Bank Transfer', 'Cash', 'Cheque', 'Mobile Money'];
    const congregations = ['Harare Central', 'Masvingo', 'Gweru', 'Chivhu', 'Chipinge', 'Bulawayo', 'Head Office'];

    // Generate realistic transactions over past 12 months
    for (let i = 0; i < 60; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const typeIdx = Math.floor(Math.random() * 3);
      const type = types[typeIdx];
      const amount = type === 'Expenditure'
        ? Math.floor(Math.random() * 8000) + 500
        : Math.floor(Math.random() * 25000) + 1000;
      const catIdx = Math.floor(Math.random() * categories.length);
      const donorIdx = Math.floor(Math.random() * donors.length);
      const grantIdx = Math.floor(Math.random() * grants.length);
      const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'Approved'];
      const approvalStatuses = ['Approved', 'Approved', 'Approved', 'Pending Review', 'Pending Approval'];

      transactions.push({
        transactionId: `TXN-${Date.now()}-${String(i).padStart(3, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        type, amount, currency: 'USD',
        donor: donors[donorIdx]._id,
        grant: grants[grantIdx]._id,
        description: `${type} - ${categories[catIdx]} program (${congregations[Math.floor(Math.random() * congregations.length)]})`,
        category: categories[catIdx],
        paymentMethod: methods[Math.floor(Math.random() * methods.length)],
        reference: `REF-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        date,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        approvalStatus: approvalStatuses[Math.floor(Math.random() * approvalStatuses.length)],
        initiatedBy: users[Math.floor(Math.random() * users.length)].name,
        congregation: congregations[Math.floor(Math.random() * congregations.length)],
        reconciled: Math.random() > 0.3,
        isFlagged: Math.random() > 0.92,
        flagReason: Math.random() > 0.92 ? 'Amount exceeds normal threshold' : undefined
      });
    }

    await Transaction.insertMany(transactions);
    console.log(`✅ ${transactions.length} transactions created`);

    // Create audit logs
    const auditEntries = [
      { action: 'CREATE', entity: 'Grant', description: 'Primary School Infrastructure Upgrade grant created', performedBy: 'Rev. Tapiwa Moyo', role: 'admin', severity: 'High' },
      { action: 'APPROVE', entity: 'Transaction', description: 'Grant disbursement of $25,000 approved for Health Outreach', performedBy: 'Grace Chikwanha', role: 'finance_officer', severity: 'High' },
      { action: 'UPDATE', entity: 'Grant', description: 'Milestone completed: Phase 1 Assessment', performedBy: 'Peter Banda', role: 'project_manager', severity: 'Medium' },
      { action: 'FLAG', entity: 'Transaction', description: 'Transaction flagged: Amount exceeds normal threshold', performedBy: 'Sarah Ncube', role: 'auditor', severity: 'Critical' },
      { action: 'LOGIN', entity: 'User', description: 'User logged in: Grace Chikwanha', performedBy: 'Grace Chikwanha', role: 'finance_officer', severity: 'Low' },
      { action: 'EXPORT', entity: 'Report', description: 'Q1 2025 Financial Report exported', performedBy: 'James Mudenda', role: 'treasurer', severity: 'Medium' },
      { action: 'CREATE', entity: 'Donor', description: 'New donor registered: Bread for the World', performedBy: 'Rev. Tapiwa Moyo', role: 'admin', severity: 'Medium' },
      { action: 'UPDATE', entity: 'Transaction', description: 'Transaction reconciled: REF-202503-015', performedBy: 'Grace Chikwanha', role: 'finance_officer', severity: 'Low' },
      { action: 'APPROVE', entity: 'Transaction', description: 'Expenditure of $3,500 for school supplies approved', performedBy: 'James Mudenda', role: 'treasurer', severity: 'Medium' },
      { action: 'VIEW', entity: 'Report', description: 'Donor confidence dashboard viewed', performedBy: 'Sarah Ncube', role: 'auditor', severity: 'Low' }
    ];

    for (let i = 0; i < auditEntries.length; i++) {
      auditEntries[i].timestamp = new Date(now.getTime() - i * 3600000 * Math.floor(Math.random() * 24 + 1));
    }

    await AuditLog.insertMany(auditEntries);
    console.log(`✅ ${auditEntries.length} audit log entries created`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin:          admin@rcz.org.zw / password123');
    console.log('   Finance Officer: finance@rcz.org.zw / password123');
    console.log('   Treasurer:       treasurer@rcz.org.zw / password123');
    console.log('   Auditor:         auditor@rcz.org.zw / password123');
    console.log('   Project Manager: projects@rcz.org.zw / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
