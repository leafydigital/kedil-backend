const BankBalance = require('../models/BankBalance');

// Create Balance
exports.createBankBalance = async (req, res) => {
    try {
        let Balance = await BankBalance.findOne({ bank_id: req.body.bank_id, user_id: req.body.user_id, budget_month: req.body.budget_month, budget_year: req.body.budget_year });

        if (Balance) {
            Balance = BankBalance.findByIdAndUpdate(Balance._id, req.body, { new: true });
        }
        else {
            Balance = new BankBalance(req.body);
        }

        await Balance.save();

        res.status(201).json(Balance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all BanksBalance
exports.getAllBanksBalance = async (req, res) => {
    try {
        const BanksBalance = await BankBalance.find({ user_id: req.user.user_id });
        res.status(200).json(BanksBalance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Balance by ID
exports.getBalanceById = async (req, res) => {
    try {
        const Balance = await BankBalance.findById(req.params.id).populate('user_id');
        if (!Balance) return res.status(404).json({ message: 'Balance not found' });
        res.status(200).json(Balance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Balance
exports.updateBankBalance = async (req, res) => {
    try {
        let Balance = await BankBalance.findOne({ bank_id: req.body.bank_id, user_id: req.user.user_id, budget_month: req.body.budget_month, budget_year: req.body.budget_year });

        if (Balance) {

            let existingBalance = Balance.balance_amount;

            if(req.body.balance_amount < 0) // Checks whether we subtract the amount / add the amount to the existing balance
            {
                existingBalance = existingBalance + balance_amount;
            }
            else if(req.body.balance_amount > 0) // Checks whether we subtract the amount / add the amount to the existing balance
            {
                existingBalance = existingBalance - balance_amount;
            }

            data.account_balance = existingBalance;
            
            Balance = BankBalance.findByIdAndUpdate(Balance._id, req.body, { new: true });
        }
        else {
            Balance = new BankBalance({
                ...req.body,
                user_id: req.user.user_id
            });
        }

        await Balance.save();

        res.status(201).json(Balance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateBalance = async (data, session = null) => {
    try {

        let Balance = await BankBalance.findOne({ bank_id: data.bank_id, user_id: data.user_id, budget_month: data.budget_month, budget_year: data.budget_year });

        if (Balance) {

            let existingBalance = Balance.account_balance;

            if(data.account_balance < 0) // Checks whether we subtract the amount / add the amount to the existing balance
            {
                existingBalance = existingBalance + account_balance;
            }
            else if(data.account_balance > 0) // Checks whether we subtract the amount / add the amount to the existing balance
            {
                existingBalance = existingBalance - account_balance;
            }

            data.account_balance = existingBalance;
            
            Balance = BankBalance.findByIdAndUpdate(Balance._id, data, { new: true });
        }
        else {

            Balance = new BankBalance({
                ...data,
                user_id: data.user_id
            });

            await Balance.save();
        }      

        return Balance;

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete Balance
exports.deleteBalanceAccount = async (req, res) => {
    try {
        const Balance = await BankBalance.findByIdAndDelete(req.params.id);
        if (!Balance) return res.status(404).json({ message: 'Balance not found' });
        res.status(200).json({ message: 'Balance deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};