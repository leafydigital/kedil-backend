const BankBalance = require('../models/BankBalance');

const BankAccount = require('../models/BankAccount');

const updateBalance = async (data, session = null) => {
    try {
        const { bank_id, user_id, budget_month, budget_year } = data;

        const amountChange = data.account_balance; // This is already a signed value

        // --- 1. Update or create monthly BankBalance ---
        let balance = await BankBalance.findOne({
            bank_id,
            user_id,
            budget_month,
            budget_year
        }).session?.(session);

        if (balance) {
            balance.account_balance += amountChange;
            await balance.save({ session });
        } else {
            balance = new BankBalance({
                bank_id,
                user_id,
                budget_month,
                budget_year,
                account_balance: amountChange
            });
            await balance.save({ session });
        }

        // --- 2. Update BankAccount overall balance ---
        const bankAccount = await BankAccount.findOne({ _id: bank_id, user_id }).session?.(session);
        if (!bankAccount) throw new Error("Bank account not found");

        bankAccount.account_balance += amountChange;
        await bankAccount.save({ session });

        return balance;
    } catch (err) {
        throw new Error('Balance update failed: ' + err.message);
    }
};


module.exports = {
    updateBalance
};
