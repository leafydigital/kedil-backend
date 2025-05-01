const BankAccount = require('../models/BankAccount');

const Transactions = require('../models/Transactions');

const { updateBalance } = require('../services/balanceService');

// Create bank
exports.createBankAccount = async (req, res) => {
    try {

        const userId = req.user.user_id;

        let account_balance = req.body.account_balance;
       
        const existingBank = await BankAccount.findOne({ bank_name: req.body.bank_name, user_id: req.body.user_id, is_active: true });
        if (existingBank) {
            return res.status(400).json({ message: 'Bank already exists for this user' });
        }

        const bank = new BankAccount({
            ...req.body,
            account_balance: 0,
            user_id: userId
        });

        await bank.save();

        const transactions = new Transactions({
            user_id: userId,
            vendor_id: null,
            transaction_date: Date.now(),
            group_id: null,
            category_id: null,
            transaction_type: "Credit",
            transaction_amount: req.body.account_balance,
            transaction_description: "Initial Balance",
            bank_account: bank._id
        });

        await transactions.save();

        const now = new Date(); // ✅ Define 'now' first

        await updateBalance({
            user_id: userId,
            budget_month: now.getMonth() + 1,
            budget_year: now.getFullYear(),
            account_balance: account_balance,
            bank_id: bank._id
        });

        res.status(201).json(bank);

    } catch (err) {
        res.status(400).json({ error: err.message, message: 'Error Occured while creating the bank ' +err.message });
    }
};

// Get all banks
exports.getBankAccounts = async (req, res) => {
    try {
        const banks = await BankAccount.find({ user_id: req.user.user_id, is_active: true }).populate('user_id');
        res.status(200).json(banks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get bank by ID
exports.getBankAccountById = async (req, res) => {
    try {
        const bank = await BankAccount.findById(req.params.id).populate('user_id');
        if (!bank) return res.status(404).json({ message: 'Bank not found' });
        res.status(200).json(bank);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update bank
exports.updateBankAccount = async (req, res) => {
    try {
        const bank = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bank) return res.status(404).json({ message: 'Bank not found' });
        res.status(200).json(bank);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete bank
exports.deleteBankAccount = async (req, res) => {
    try {
        const bank = await BankAccount.findByIdAndDelete(req.params.id);
        if (!bank) return res.status(404).json({ message: 'Bank not found' });
        res.status(200).json({ message: 'Bank deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};