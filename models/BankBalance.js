const mongoose = require('mongoose');

const BankBalanceSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    budget_month: Number,
    budget_year: Number,
    account_balance: Number,
    bank_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
    created_at: { type: Date, default: Date.now }
});
module.exports = mongoose.model('BankBalance', BankBalanceSchema);