const User = require('./backend/models/user');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ethio-job-portal');
    const counts = await Promise.all([
      User.countDocuments({ role: { $in: ['jobseeker', 'employer'] } }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'jobseeker' }),
    ]);
    console.log(JSON.stringify({ totalUsers: counts[0], employers: counts[1], jobseekers: counts[2] }));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
