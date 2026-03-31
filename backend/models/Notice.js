const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['general', 'exam', 'holiday', 'event', 'urgent'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers'],
    required: true
  },
  // Optional filters
  targetBranch: { type: String },
  targetYear: { type: Number },
  targetSection: { type: String },
  attachments: [{ fileUrl: String, originalName: String }],
  isPinned: { type: Boolean, default: false },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

noticeSchema.index({ targetAudience: 1, isActive: 1, createdAt: -1 });
noticeSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
