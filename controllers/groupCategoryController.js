const Group = require('../models/Group');
const Category = require('../models/Category');

const defaultGroups = require('./defaultGroups');

// Category Controllers
exports.createCategory = async (req, res) => {
    try {
        const existingCategory = await Category.findOne({ category_name: req.body.category_name, user_id: req.user.user_id });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists for this user' });
        }
        const category = new Category({
            ...req.body,
            user_id: req.user.user_id
        });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ user_id: req.user.user_id }).populate('group_id');
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Group Controllers
exports.createGroup = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const groupName = req.body.group_name;

        const existingGroup = await Group.findOne({ group_name: groupName, user_id: userId });

        if (existingGroup) {
            return res.status(400).json({ message: 'Group name already exists' });
        }

        const newGroup = new Group({
            ...req.body,
            user_id: req.user.user_id
        });

        await newGroup.save();

        res.status(201).json(newGroup);

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


exports.getGroups = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let userGroups = await Group.find({ user_id: userId });

        // Extract existing group names
        const existingGroupNames = userGroups.map(g => g.group_name.toLowerCase());

        // Filter only the default groups the user hasn't already created
        const missingDefaultGroups = defaultGroups
            .filter(defaultGroup => !existingGroupNames.includes(defaultGroup.group_name.toLowerCase()))
            .map(g => ({
                ...g,
                _id: `default-${g.group_name.toLowerCase().replace(/\s/g, '-')}`, // fake id for frontend
                is_default: true
            }));

        // Combine user groups and missing defaults
        const groups = [...userGroups, ...missingDefaultGroups];

        // if(groups.length == 0)
        // {
        //     groups = defaultGroups.map(g => ({ ...g, _id: 0, is_default: true }));
        // }

        res.status(200).json(groups);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('category_id').populate('user_id');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(req.params.id,
            { is_active: false },
            { new: true });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
