const Transactions = require('../models/Transactions');

const Budget = require('../models/Budget');

const UPIVendor = require('../models/UPIVendor');

exports.createTransactions = async (req, res) => {
    try {

        const userId = req.user.user_id;

        var vendor_id = req.body.vendor_id;

        const existingVendor = await UPIVendor.findOne({ vendor_name: req.body.vendor_id, user_id: req.user.user_id });
        if (!existingVendor) {

            const vendor = new UPIVendor({
                upi_id : null,
                vendor_name: req.body.vendor_id,
                vendor_category: req.body.category_id,
                user_id: userId
            });
            await vendor.save();

            vendor_id = vendor._id;
        }

        const transactions = new Transactions({
            ...req.body,
            user_id: req.user.user_id,
            vendor_id: vendor_id
        });

        await transactions.save();       


        const { transaction_date, category_id, transaction_type, transaction_amount, group_id } = req.body;

        if (transaction_type === 'Debit') {

            const [year, month, day] = transaction_date.split('-');

            const amount = parseFloat(transaction_amount); // ensure number

            // Step 2: Find existing summary
            let budgets = await Budget.findOne({
                budget_month: month,
                budget_year: year,
                budget_category_id: category_id,
                user_id: userId
            });

            if (budgets) {
                // Step 3: Update existing summary
                budgets.activity_amount += amount;

                budgets.available_amount = budgets.assigned_amount - budgets.activity_amount;

                budgets.activity_amount = -budgets.activity_amount;

                await budgets.save();
            } else {
                // Step 4: Create new summary
                budgets = new Budget({
                    budget_category_id: category_id,
                    budget_group_id: group_id,
                    budget_month: month,
                    budget_year: year,
                    assigned_amount: 0,
                    activity_amount: -amount,
                    available_amount: -amount,
                    user_id: userId
                });

                await budgets.save();
            }
        }

        res.status(201).json(transactions);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transactions.find({ user_id: req.user.user_id })
            .populate('user_id')
            .populate('vendor_id')
            .populate('group_id')
            .populate('category_id')
            .populate('bank_account');
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transactions = await Transactions.findById(req.params.id).populate('user_id');
        if (!transactions) return res.status(404).json({ message: 'Transaction not found' });
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const transactions = await Transactions.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!transactions) return res.status(404).json({ message: 'Transaction not found' });
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete bank
exports.deleteTransaction = async (req, res) => {
    try {
        const transactions = await Transactions.findByIdAndDelete(req.params.id);
        if (!transactions) return res.status(404).json({ message: 'Transaction not found' });
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};