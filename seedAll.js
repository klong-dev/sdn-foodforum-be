const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./src/models/category.model');
const Post = require('./src/models/posts.model');
const User = require('./src/models/users.model');

const categories = [
    {
        name: 'Hot',
        description: 'Trending and popular food posts',
        color: '#EF4444',
        icon: '🔥',
        subreddit: 'r/hot'
    },
    {
        name: 'New',
        description: 'Latest food posts and recipes',
        color: '#10B981',
        icon: '🆕',
        subreddit: 'r/new'
    },
    {
        name: 'Top',
        description: 'All-time favorite food posts',
        color: '#F59E0B',
        icon: '🏆',
        subreddit: 'r/top'
    },
    {
        name: 'Recipes',
        description: 'Food recipes and cooking instructions',
        color: '#8B5CF6',
        icon: '📝',
        subreddit: 'r/recipes'
    },
    {
        name: 'Desserts',
        description: 'Sweet treats and dessert recipes',
        color: '#EC4899',
        icon: '🍰',
        subreddit: 'r/desserts'
    },
    {
        name: 'Comfort Food',
        description: 'Hearty and comforting food dishes',
        color: '#F97316',
        icon: '🍲',
        subreddit: 'r/comfortfood'
    },
    {
        name: 'Healthy',
        description: 'Nutritious and healthy food options',
        color: '#22C55E',
        icon: '🥗',
        subreddit: 'r/healthy'
    },
    {
        name: 'Quick Meals',
        description: 'Fast and easy meal ideas',
        color: '#06B6D4',
        icon: '⚡',
        subreddit: 'r/quickmeals'
    },
    {
        name: 'Baking',
        description: 'Bread, pastries, and baked goods',
        color: '#D97706',
        icon: '🍞',
        subreddit: 'r/baking'
    },
    {
        name: 'International',
        description: 'Cuisines from around the world',
        color: '#7C3AED',
        icon: '🌍',
        subreddit: 'r/international'
    }
];

const samplePosts = [
    {
        title: "🔥 Classic Sourdough Bread Recipe",
        content: "This is my grandmother's classic sourdough recipe that has been passed down through generations. The key to perfect sourdough is patience and understanding the fermentation process.",
        imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        categoryName: "Baking",
        votes: 125,
        commentCount: 8,
    },
    {
        title: "🍝 Authentic Carbonara Recipe",
        content: "Learn how to make authentic Roman carbonara with just 5 ingredients! This classic Italian pasta dish is all about technique and timing.",
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        categoryName: "International",
        votes: 89,
        commentCount: 15,
    },
    {
        title: "🥗 Fresh Mediterranean Bowl",
        content: "This colorful Mediterranean bowl is packed with fresh vegetables, herbs, and protein. Perfect for a healthy lunch or dinner!",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        categoryName: "Healthy",
        votes: 67,
        commentCount: 5,
    },
    {
        title: "🍰 Decadent Chocolate Cake",
        content: "Rich, moist chocolate cake that's perfect for any celebration. This recipe never fails to impress!",
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=2089&q=80",
        categoryName: "Desserts",
        votes: 156,
        commentCount: 22,
    },
    {
        title: "🍲 Hearty Beef Stew",
        content: "Nothing beats a warm, comforting bowl of beef stew on a cold day. This recipe is perfect for family dinners.",
        imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80",
        categoryName: "Comfort Food",
        votes: 98,
        commentCount: 12,
    },
    {
        title: "⚡ 15-Minute Stir Fry",
        content: "Quick and delicious stir fry that's perfect for busy weeknights. Customize with your favorite vegetables!",
        imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80",
        categoryName: "Quick Meals",
        votes: 73,
        commentCount: 9,
    },
    {
        title: "🍞 Easy No-Knead Bread",
        content: "This no-knead bread recipe is perfect for beginners. Just mix, rise, and bake for amazing homemade bread!",
        imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        categoryName: "Baking",
        votes: 112,
        commentCount: 18,
    },
    {
        title: "🌍 Thai Green Curry",
        content: "Authentic Thai green curry with coconut milk and fresh herbs. Spicy, aromatic, and absolutely delicious!",
        imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80",
        categoryName: "International",
        votes: 145,
        commentCount: 25,
    }
];

const seedAll = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdn-foodforum');
        console.log('Connected to MongoDB');

        // Check if we have users
        const users = await User.find().limit(5);
        if (users.length === 0) {
            console.log('No users found. Please create some users first using seedUser.js');
            process.exit(1);
        }

        // Clear existing data
        await Category.deleteMany({});
        await Post.deleteMany({});
        console.log('Cleared existing categories and posts');

        // Insert categories
        const insertedCategories = await Category.insertMany(categories);
        console.log(`Inserted ${insertedCategories.length} categories`);

        // Create category lookup map
        const categoryMap = {};
        insertedCategories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        // Create posts with category references
        const postsWithRefs = samplePosts.map((post, index) => ({
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            category: categoryMap[post.categoryName],
            votes: post.votes,
            commentCount: post.commentCount,
            author: users[index % users.length]._id,
            status: 'active'
        }));

        const insertedPosts = await Post.insertMany(postsWithRefs);
        console.log(`Inserted ${insertedPosts.length} posts`);

        // Update category post counts
        for (const category of insertedCategories) {
            const postCount = await Post.countDocuments({ category: category._id });
            await Category.findByIdAndUpdate(category._id, { postCount });
        }

        console.log('Database seeding completed successfully!');
        console.log('Categories created:');
        insertedCategories.forEach(cat => {
            console.log(`- ${cat.name} (${cat.icon})`);
        });

        console.log('Sample posts created with proper category references.');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the seeding function
seedAll();
