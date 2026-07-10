import { Schema, model } from 'mongoose';

const LogSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for public actions
  action: { type: String, required: true },
  category: { type: String, default: 'general' }, // 'auth', 'application', 'resume', 'ai', 'admin'
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  details: { type: String, default: '' }
}, {
  timestamps: { createdAt: true, updatedAt: false } // only needs createdAt
});

export const Log = model('Log', LogSchema);
export default Log;
