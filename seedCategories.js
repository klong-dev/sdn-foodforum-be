const mongoose = require('mongoose');
const Category = require('./src/models/category.model');
require('dotenv').config();

const categories = [
    {
        name: 'Hot',
        description: 'Trending and popular food posts',
        color: '#EF4444',
        icon: '🔥'
    },
    {
        name: 'New',
        description: 'Latest food posts and recipes',
        color: '#10B981',
        icon: '🆕'
    },
    {
        name: 'Top',
        description: 'All-time favorite food posts',
        color: '#F59E0B',
        icon: '🏆'
    },
    {
        name: 'Recipes',
        description: 'Food recipes and cooking instructions',
        color: '#8B5CF6',
        icon: '📝'
    },
    {
        name: 'Desserts',
        description: 'Sweet treats and dessert recipes',
        color: '#EC4899',
        icon: '🍰'
    },
    {
        name: 'Comfort Food',
        description: 'Hearty and comforting food dishes',
        color: '#F97316',
        icon: '🍲'
    },
    {
        name: 'Healthy',
        description: 'Nutritious and healthy food options',
        color: '#22C55E',
        icon: '🥗'
    },
    {
        name: 'Quick Meals',
        description: 'Fast and easy meal ideas',
        color: '#06B6D4',
        icon: '⚡'
    },
    {
        name: 'Baking',
        description: 'Bread, pastries, and baked goods',
        color: '#D97706',
        icon: '🍞'
    },
    {
        name: 'International',
        description: 'Cuisines from around the world',
        color: '#7C3AED',
        icon: '🌍'
    }
];

const seedCategories = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdn-foodforum');
        console.log('Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        // Insert new categories
        const insertedCategories = await Category.insertMany(categories);
        console.log(`Inserted ${insertedCategories.length} categories`);

        insertedCategories.forEach(category => {
            console.log(`- ${category.name} (${category.icon})`);
        });

        console.log('Category seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the seeding function
seedCategories();
