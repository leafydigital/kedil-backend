const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bank_name: String,
    account_type: String,
    account_balance: Number,
    created_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
});
module.exports = mongoose.model('BankAccount', BankAccountSchema);