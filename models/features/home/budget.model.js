import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: String,
  amount: Number,
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Budget', budgetSchema);
