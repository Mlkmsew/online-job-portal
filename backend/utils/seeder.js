// ============================================
// Database Seeder - Sample Data
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Category = require('../models/Category');
const Skill = require('../models/Skill');

// Ethiopian regions
const regions = [
  'Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'Sidama', 'Somali',
  'Afar', 'Benishangul-Gumuz', 'Gambela', 'Harari',
  'Central Ethiopia', 'South Ethiopia', 'South West Ethiopia', 'Dire Dawa'
];

// Categories data
const categoriesData = [
  { name: 'Information Technology', icon: '💻', color: '#0F766E' },
  { name: 'Healthcare', icon: '🏥', color: '#14B8A6' },
  { name: 'Agriculture', icon: '🌾', color: '#22C55E' },
  { name: 'Finance & Banking', icon: '💰', color: '#F59E0B' },
  { name: 'Education', icon: '📚', color: '#3B82F6' },
  { name: 'Engineering', icon: '⚙️', color: '#8B5CF6' },
  { name: 'Construction', icon: '🏗️', color: '#EF4444' },
  { name: 'Marketing & Sales', icon: '📈', color: '#EC4899' },
  { name: 'Hospitality & Tourism', icon: '🏨', color: '#06B6D4' },
  { name: 'Government & NGO', icon: '🏛️', color: '#10B981' },
  { name: 'Manufacturing', icon: '🏭', color: '#6366F1' },
  { name: 'Transport & Logistics', icon: '🚚', color: '#F97316' },
  { name: 'Telecommunication', icon: '📱', color: '#A855F7' },
  { name: 'Media & Communication', icon: '📺', color: '#EAB308' },
  { name: 'Legal Services', icon: '⚖️', color: '#84CC16' },
  { name: 'Customer Service', icon: '🎧', color: '#06B6D4' },
];

// Skills data
const skillsData = [
  // IT Skills
  { name: 'JavaScript', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'React.js', category: 'Programming' },
  { name: 'Node.js', category: 'Programming' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'SQL', category: 'Database' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Git', category: 'Tools' },
  // Soft Skills
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Leadership', category: 'Soft Skills' },
  { name: 'Teamwork', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
  { name: 'Time Management', category: 'Soft Skills' },
  // Business Skills
  { name: 'Project Management', category: 'Management' },
  { name: 'Data Analysis', category: 'Analytics' },
  { name: 'Digital Marketing', category: 'Marketing' },
  { name: 'Sales', category: 'Sales' },
  { name: 'Customer Service', category: 'Service' },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Category.deleteMany({});
    await Skill.deleteMany({});

    console.log('📝 Creating categories...');
    // Ensure slug is set to avoid duplicate null slug index issues when using insertMany
    const categoriesToInsert = categoriesData.map((c) => ({
      ...c,
      slug: c.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    }));
    const categories = await Category.insertMany(categoriesToInsert);

    console.log('🎯 Creating skills...');
    // Ensure skill slugs are set
    const skillsToInsert = skillsData.map((s) => ({
      ...s,
      slug: s.name.toLowerCase().replace(/\s+/g, '-'),
    }));
    const skills = await Skill.insertMany(skillsToInsert);

    console.log('👤 Creating admin user...');
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ethiojob.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
    });

    console.log('👤 Creating sample job seeker...');
    const jobSeeker = await User.create({
      firstName: 'Abebe',
      lastName: 'Bekele',
      email: 'jobseeker@ethiojob.com',
      password: 'Password@123',
      role: 'jobseeker',
      isEmailVerified: true,
      phone: '+251911234567',
      headline: 'Software Developer',
      bio: 'Passionate software developer with 3 years of experience in web development.',
      location: { region: 'Addis Ababa', city: 'Addis Ababa' },
      skills: [skills[0]._id, skills[1]._id, skills[3]._id],
      languages: [
        { name: 'Amharic', proficiency: 'Native' },
        { name: 'English', proficiency: 'Fluent' },
      ],
    });

    console.log('🏢 Creating sample employer...');
    const employer = await User.create({
      firstName: 'Mulu',
      lastName: 'Tadesse',
      email: 'employer@ethiojob.com',
      password: 'Password@123',
      role: 'employer',
      isEmailVerified: true,
      phone: '+251922345678',
    });

    console.log('🏢 Creating sample companies...');
    const company1 = await Company.create({
      name: 'Ethio Tech Solutions',
      slug: 'ethio-tech-solutions',
      description: 'Leading IT company in Ethiopia providing innovative software solutions.',
      shortDescription: 'Innovative IT solutions for Ethiopian businesses.',
      tagline: 'Technology for Ethiopia',
      industry: 'Information Technology',
      companySize: '51-200',
      foundedYear: 2015,
      companyType: 'Private',
      website: 'https://ethiotech.com',
      email: 'info@ethiotech.com',
      phone: '+251115551234',
      location: { region: 'Addis Ababa', city: 'Addis Ababa', address: 'Bole, Addis Ababa' },
      owner: employer._id,
      isApproved: true,
      isVerified: true,
      isFeatured: true,
      benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Training Programs'],
      techStack: ['React', 'Node.js', 'MongoDB', 'AWS'],
    });

    const company2 = await Company.create({
      name: 'Green Ethiopia Agriculture',
      slug: 'green-ethiopia-agriculture',
      description: 'Modernizing Ethiopian agriculture through technology and innovation.',
      shortDescription: 'Smart farming solutions for Ethiopia.',
      industry: 'Agriculture',
      companySize: '201-500',
      foundedYear: 2010,
      companyType: 'Private',
      location: { region: 'Oromia', city: 'Adama' },
      owner: employer._id,
      isApproved: true,
      isVerified: true,
    });

    console.log('💼 Creating sample jobs...');
    const jobsToInsert = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our team. You will work on exciting projects using modern technologies.',
        requirements: 'Bachelor\'s degree in Computer Science or related field. 5+ years of experience in web development. Strong knowledge of React, Node.js, and MongoDB.',
        responsibilities: 'Develop and maintain web applications. Collaborate with cross-functional teams. Write clean, maintainable code.',
        benefits: 'Competitive salary, health insurance, flexible working hours, professional development opportunities.',
        company: company1._id,
        postedBy: employer._id,
        category: categories[0]._id,
        skillsRequired: [skills[0]._id, skills[3]._id, skills[4]._id, skills[5]._id],
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: 'Senior Level',
        educationRequired: 'Bachelor',
        numberOfPositions: 2,
        salary: { min: 50000, max: 80000, currency: 'ETB', period: 'Monthly', isNegotiable: true },
        location: { region: 'Addis Ababa', city: 'Addis Ababa' },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        isFeatured: true,
        tags: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Full Stack'],
      },
      {
        title: 'Agricultural Engineer',
        description: 'Join our team to modernize Ethiopian agriculture with innovative solutions.',
        requirements: 'Bachelor\'s degree in Agricultural Engineering. Experience with modern farming techniques.',
        responsibilities: 'Design irrigation systems. Implement smart farming solutions. Train farmers.',
        company: company2._id,
        postedBy: employer._id,
        category: categories[2]._id,
        jobType: 'Full-time',
        workMode: 'On-site',
        experienceLevel: 'Mid Level',
        educationRequired: 'Bachelor',
        numberOfPositions: 3,
        salary: { min: 30000, max: 45000, currency: 'ETB', period: 'Monthly' },
        location: { region: 'Oromia', city: 'Adama' },
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        title: 'Marketing Manager',
        description: 'Lead our marketing team to expand our reach across Ethiopia.',
        requirements: 'Bachelor\'s degree in Marketing or Business. 3+ years in marketing management.',
        responsibilities: 'Develop marketing strategies. Manage social media. Analyze market trends.',
        company: company1._id,
        postedBy: employer._id,
        category: categories[7]._id,
        jobType: 'Full-time',
        workMode: 'On-site',
        experienceLevel: 'Mid Level',
        educationRequired: 'Bachelor',
        salary: { min: 35000, max: 55000, currency: 'ETB', period: 'Monthly', isNegotiable: true },
        location: { region: 'Addis Ababa', city: 'Addis Ababa' },
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    ];

    // Ensure slug is set for each job to avoid duplicate null slug index
    const jobsWithSlugs = jobsToInsert.map((j) => ({
      ...j,
      slug: (j.title || 'job').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') + '-' + Date.now(),
    }));

    const jobs = await Job.insertMany(jobsWithSlugs);

    // Update company job counts
    company1.totalJobs = 2;
    company2.totalJobs = 1;
    await company1.save();
    await company2.save();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✅  DATABASE SEEDING COMPLETED!  ✅               ║
║                                                           ║
║   👤 Users: ${(await User.countDocuments()).toString().padEnd(5)} (Admin, Employer, Job Seeker)       ║
║   🏢 Companies: ${(await Company.countDocuments()).toString().padEnd(5)}                                  ║
║   💼 Jobs: ${(await Job.countDocuments()).toString().padEnd(5)}                                       ║
║   📂 Categories: ${(await Category.countDocuments()).toString().padEnd(5)}                             ║
║   🎯 Skills: ${(await Skill.countDocuments()).toString().padEnd(5)}                                   ║
║                                                           ║
║   📧 Test Accounts:                                      ║
║   Admin: admin@ethiojob.com / Admin@123                 ║
║   Employer: employer@ethiojob.com / Password@123        ║
║   Job Seeker: jobseeker@ethiojob.com / Password@123     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
