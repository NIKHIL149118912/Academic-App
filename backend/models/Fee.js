const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: {
    type: String,
    enum: ['tuition', 'exam', 'library', 'lab', 'hostel', 'transport', 'development', 'other'],
    required: true
  },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partial', 'waived'],
    default: 'pending'
  },
  paidAmount: { type: Number, default: 0 },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  transactionId: { type: String },
  paymentMode: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'dd', 'other']
  },
  receiptNumber: { type: String },
  remarks: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

feeSchema.virtual('balance').get(function () {
  return this.amount - this.paidAmount;
});

feeSchema.index({ student: 1, academicYear: 1, semester: 1 });
feeSchema.index({ status: 1, dueDate: 1 });

// Auto-update status to overdue
feeSchema.pre('save', function (next) {
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
