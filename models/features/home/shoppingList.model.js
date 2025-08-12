import mongoose from 'mongoose';

const shoppingItemSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: String, default: '1' },
  
  isPurchased: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('ShoppingList', shoppingItemSchema);
