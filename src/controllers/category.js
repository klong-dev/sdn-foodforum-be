const Category = require('../models/category.model');

const categoryController = {
    // Get all categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get category by ID
    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create new category
    createCategory: async (req, res) => {
        try {
            const newCategory = new Category(req.body);
            const savedCategory = await newCategory.save();
            res.status(201).json(savedCategory);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Category name already exists' });
            }
            res.status(500).json({ message: error.message });
        }
    },

    // Update category
    updateCategory: async (req, res) => {
        try {
            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!updatedCategory) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json(updatedCategory);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete category (soft delete)
    deleteCategory: async (req, res) => {
        try {
            const deletedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                { status: 'inactive' },
                { new: true }
            );
            if (!deletedCategory) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = categoryController;
