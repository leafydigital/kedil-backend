const express = require('express');
const {
    createTransactions,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

const router = express.Router();

// UPI Vendor Routes
router.post('/create', createTransactions);
router.get('/select', getTransactions);
router.get('/select/:id', getTransactionById);
router.put('/update/:id', updateTransaction);
router.put('/delete/:id', deleteTransaction);


module.exports = router;