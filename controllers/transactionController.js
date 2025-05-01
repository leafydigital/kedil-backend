const Transactions = require('../models/Transactions');

const Budget = require('../models/Budget');

const UPIVendor = require('../models/UPIVendor');

const Category = require('../models/Category');

const { updateBalance } = require('../services/balanceService');

exports.createTransactions = async (req, res) => {
    try {

        const userId = req.user.user_id;

        var vendor_id = req.body.vendor_id;

        const categoryToFindGroup = Category.findById({ category_id: req.body.category_id });

        if (categoryToFindGroup) {
            req.body.group_id = categoryToFindGroup.group_id;
        }

        if (req.body.vendor_id != "" && req.body.vendor_id != undefined) {
            const existingVendor = await UPIVendor.findOne({ vendor_name: req.body.vendor_id, user_id: req.user.user_id });
            if (!existingVendor) {

                const vendor = new UPIVendor({
                    upi_id: null,
                    vendor_name: req.body.vendor_id,
                    vendor_category: req.body.category_id,
                    user_id: userId
                });
                await vendor.save();

                vendor_id = vendor._id;
            }
        }
        else {
            vendor_id = null;
        }

        const transactions = new Transactions({
            ...req.body,
            user_id: req.user.user_id,
            vendor_id: vendor_id
        });

        await transactions.save();

        const { transaction_date, category_id, transaction_type, transaction_amount, group_id, bank_account } = req.body;

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

            await updateBalance({
                user_id: userId,
                budget_month: month,
                budget_year: year,
                account_balance: -amount,
                bank_id: bank_account
            });

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
        const userId = req.user.user_id;
        const transactionId = req.params.id;
        const {
            vendor_id: vendorInput,
            transaction_amount,
            transaction_type,
            transaction_date,
            category_id,
            group_id,
            bank_account,
        } = req.body;

        // Step 1: Find existing transaction
        const oldTransaction = await Transactions.findById(transactionId);
        if (!oldTransaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Step 2: Get vendor_id (check if new vendor name)
        let vendor_id = vendorInput;
        if (vendorInput && vendorInput !== "") {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorInput);
            if (!isObjectId) {
                const existingVendor = await UPIVendor.findOne({ vendor_name: vendorInput, user_id: userId });
                if (existingVendor) {
                    vendor_id = existingVendor._id;
                } else {
                    const newVendor = new UPIVendor({
                        upi_id: null,
                        vendor_name: vendorInput,
                        vendor_category: category_id,
                        user_id: userId,
                    });
                    await newVendor.save();
                    vendor_id = newVendor._id;
                }
            }
        } else {
            vendor_id = null;
        }

        // Step 3: Update only fields that changed
        const updatedTransaction = await Transactions.findByIdAndUpdate(
            transactionId,
            { ...req.body, vendor_id },
            { new: true }
        );

        // Step 4: Check if amount/type changed
        const oldAmount = parseFloat(oldTransaction.transaction_amount);
        const newAmount = parseFloat(transaction_amount);
        const oldType = oldTransaction.transaction_type;
        const newType = transaction_type;

        const [year, month] = transaction_date.split('-');

        let balanceDifference = 0;
        let budgetDiff = 0;

        if (oldAmount !== newAmount || oldType !== newType) {
            // Debit to Debit
            if (oldType === "Debit" && newType === "Debit") {
                balanceDifference = newAmount - oldAmount;
                budgetDiff = newAmount - oldAmount;

                // Credit to Credit
            } else if (oldType === "Credit" && newType === "Credit") {
                balanceDifference = oldAmount - newAmount;
                budgetDiff = 0;

                // Debit to Credit (reverse debit effect, apply credit effect)
            } else if (oldType === "Debit" && newType === "Credit") {
                balanceDifference = oldAmount + newAmount; // restore debit, apply credit
                budgetDiff = -oldAmount;

                // Credit to Debit (reverse credit effect, apply debit effect)
            } else if (oldType === "Credit" && newType === "Debit") {
                balanceDifference = -oldAmount - newAmount;
                budgetDiff = newAmount;
            }

            // Step 5: Update Budget (if applicable)
            if (budgetDiff !== 0 && newType === "Debit") {
                let budget = await Budget.findOne({
                    budget_month: month,
                    budget_year: year,
                    budget_category_id: category_id,
                    user_id: userId
                });

                if (budget) {
                    budget.activity_amount += budgetDiff;
                    budget.activity_amount = -Math.abs(budget.activity_amount);
                    budget.available_amount = budget.assigned_amount + budget.activity_amount;
                    await budget.save();
                } else {
                    // Create if not found
                    budget = new Budget({
                        budget_category_id: category_id,
                        budget_group_id: group_id,
                        budget_month: month,
                        budget_year: year,
                        assigned_amount: 0,
                        activity_amount: -newAmount,
                        available_amount: -newAmount,
                        user_id: userId
                    });
                    await budget.save();
                }
            }

            // Step 6: Update Bank Account Balance
            await updateBalance({
                user_id: userId,
                budget_month: month,
                budget_year: year,
                account_balance: -balanceDifference,
                bank_id: bank_account
            });
        }

        res.status(200).json(updatedTransaction);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

    // try {
    //     const transactions = await Transactions.findByIdAndUpdate(req.params.id, req.body, { new: true });
    //     if (!transactions) return res.status(404).json({ message: 'Transaction not found' });
    //     res.status(200).json(transactions);
    // } catch (err) {
    //     res.status(500).json({ error: err.message });
    // }

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