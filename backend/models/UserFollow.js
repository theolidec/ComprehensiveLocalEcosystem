const mongoose = require('mongoose');

const userFollowSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

userFollowSchema.index({ follower: 1, following: 1 }, { unique: true });
userFollowSchema.index({ following: 1, createdAt: -1 });

userFollowSchema.statics.follow = async function(followerId, followingId) {
  if (followerId.toString() === followingId.toString()) {
    throw new Error('Cannot follow yourself');
  }
  
  const existing = await this.findOne({ follower: followerId, following: followingId });
  if (existing) return existing;
  
  return await this.create({ follower: followerId, following: followingId });
};

userFollowSchema.statics.unfollow = async function(followerId, followingId) {
  return await this.deleteOne({ follower: followerId, following: followingId });
};

userFollowSchema.statics.getFollowers = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [followers, total] = await Promise.all([
    this.find({ following: userId })
      .populate('follower', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments({ following: userId })
  ]);

  const orphanedIds = followers.filter(f => !f.follower).map(f => f._id);
  if (orphanedIds.length > 0) {
    this.deleteMany({ _id: { $in: orphanedIds } }).catch(() => {});
  }

  const validUsers = followers.map(f => f.follower).filter(Boolean);
  const validTotal = total - orphanedIds.length;

  return {
    users: validUsers,
    pagination: { page, limit, total: validTotal, totalPages: Math.ceil(validTotal / limit) }
  };
};

userFollowSchema.statics.getFollowing = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [following, total] = await Promise.all([
    this.find({ follower: userId })
      .populate('following', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments({ follower: userId })
  ]);

  const orphanedIds = following.filter(f => !f.following).map(f => f._id);
  if (orphanedIds.length > 0) {
    this.deleteMany({ _id: { $in: orphanedIds } }).catch(() => {});
  }

  const validUsers = following.map(f => f.following).filter(Boolean);
  const validTotal = total - orphanedIds.length;

  return {
    users: validUsers,
    pagination: { page, limit, total: validTotal, totalPages: Math.ceil(validTotal / limit) }
  };
};

module.exports = mongoose.model('UserFollow', userFollowSchema);
