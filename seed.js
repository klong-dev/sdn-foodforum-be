const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./src/models/posts.model');
const User = require('./src/models/users.model');
const Category = require('./src/models/category.model');

// Sample post data with recipe information
const samplePosts = [
    {
        title: "🔥 Classic Sourdough Bread Recipe",
        content: "This is my grandmother's classic sourdough recipe that has been passed down through generations. The key to perfect sourdough is patience and understanding the fermentation process. This recipe creates a crispy crust with a soft, tangy interior that's perfect for any meal.",
        imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Bread & Baking",
        subreddit: "r/sourdough",
        votes: 125,
        commentCount: 0,
        recipe: {
            prepTime: "30 minutes",
            cookTime: "45 minutes",
            totalTime: "24 hours",
            servings: "1 large loaf (8-10 slices)",
            difficulty: "Intermediate",
            ingredients: [
                "100g active sourdough starter",
                "500g bread flour",
                "375ml lukewarm water",
                "10g salt",
                "1 tbsp olive oil",
                "Coarse sea salt for topping"
            ],
            instructions: [
                "In a large mixing bowl, combine the active sourdough starter with lukewarm water. Mix until well combined.",
                "Add the bread flour and mix until a shaggy dough forms. Let it rest for 30 minutes (autolyse).",
                "Add salt and olive oil to the dough. Mix and knead for 10-15 minutes until smooth and elastic.",
                "Place dough in an oiled bowl, cover with a damp cloth. Let it rise at room temperature for 12-18 hours.",
                "Turn the dough onto a floured surface. Gently shape into a round loaf.",
                "Place on parchment paper, cover, and let rise for 4-6 hours until doubled in size.",
                "Preheat oven to 450°F (230°C) with a Dutch oven inside for 30 minutes.",
                "Score the top of the loaf with a sharp knife. Sprinkle with coarse sea salt.",
                "Carefully transfer to the hot Dutch oven. Cover and bake for 30 minutes.",
                "Remove lid and bake for another 15-20 minutes until golden brown.",
                "Cool on a wire rack for at least 1 hour before slicing."
            ]
        }
    },
    {
        title: "🍝 Authentic Carbonara Recipe",
        content: "Learn how to make authentic Roman carbonara with just 5 ingredients! This classic Italian pasta dish is all about technique and timing. No cream needed - just eggs, cheese, pancetta, and black pepper create the silky sauce.",
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Italian Cuisine",
        subreddit: "r/pasta",
        votes: 89,
        commentCount: 0,
        recipe: {
            prepTime: "10 minutes",
            cookTime: "15 minutes",
            totalTime: "25 minutes",
            servings: "4 people",
            difficulty: "Easy",
            ingredients: [
                "400g spaghetti or tonnarelli",
                "200g guanciale or pancetta, diced",
                "4 large egg yolks",
                "100g Pecorino Romano cheese, grated",
                "Freshly ground black pepper",
                "Salt for pasta water"
            ],
            instructions: [
                "Bring a large pot of salted water to boil for the pasta.",
                "In a large bowl, whisk together egg yolks, grated Pecorino Romano, and plenty of black pepper.",
                "Cook the guanciale in a large skillet over medium heat until crispy, about 8-10 minutes.",
                "Cook pasta according to package directions until al dente. Reserve 1 cup pasta cooking water.",
                "Add hot drained pasta to the skillet with guanciale and toss briefly.",
                "Remove from heat and immediately add the egg mixture, tossing quickly with pasta water to create a creamy sauce.",
                "Add more pasta water as needed to achieve silky consistency.",
                "Serve immediately with extra Pecorino and black pepper."
            ]
        }
    },
    {
        title: "🥗 Fresh Mediterranean Bowl",
        content: "This colorful Mediterranean bowl is packed with fresh vegetables, herbs, and protein. It's perfect for a healthy lunch or dinner and can be customized with your favorite ingredients. The tahini dressing brings everything together beautifully.",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Healthy Eating",
        subreddit: "r/mealprep",
        votes: 67,
        commentCount: 0,
        recipe: {
            prepTime: "20 minutes",
            cookTime: "0 minutes",
            totalTime: "20 minutes",
            servings: "2 bowls",
            difficulty: "Easy",
            ingredients: [
                "2 cups cooked quinoa",
                "1 cucumber, diced",
                "2 tomatoes, chopped",
                "1/2 red onion, thinly sliced",
                "1/2 cup Kalamata olives",
                "200g feta cheese, crumbled",
                "1/4 cup fresh parsley, chopped",
                "2 tbsp olive oil",
                "1 lemon, juiced",
                "Salt and pepper to taste"
            ],
            instructions: [
                "Cook quinoa according to package directions and let cool.",
                "Prepare all vegetables by washing, chopping, and dicing as specified.",
                "In a small bowl, whisk together olive oil, lemon juice, salt, and pepper for dressing.",
                "Divide quinoa between two bowls as the base.",
                "Arrange cucumber, tomatoes, red onion, and olives on top of quinoa.",
                "Sprinkle crumbled feta cheese over each bowl.",
                "Drizzle with dressing and garnish with fresh parsley.",
                "Serve immediately or refrigerate for up to 2 days."
            ]
        }
    }
];

async function seedDatabase() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if we have any users to associate posts with
        const users = await User.find().limit(3);
        if (users.length === 0) {
            console.log('No users found. Please create some users first.');
            process.exit(1);
        }

        // Get categories for post assignment
        const categories = await Category.find();
        if (categories.length === 0) {
            console.log('No categories found. Please run seedCategories.js first.');
            process.exit(1);
        }

        // Clear existing posts
        await Post.deleteMany({});
        console.log('Cleared existing posts');

        // Map category names to category IDs
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        // Create sample posts with category references
        const postsWithAuthors = samplePosts.map((post, index) => {
            // Find matching category or use a default one
            let categoryId = categoryMap['Recipes']; // default

            if (post.category === 'Bread & Baking') categoryId = categoryMap['Baking'];
            else if (post.category === 'Italian Cuisine') categoryId = categoryMap['International'];
            else if (post.category === 'Healthy Eating') categoryId = categoryMap['Healthy'];

            return {
                ...post,
                category: categoryId || categories[0]._id, // fallback to first category
                author: users[index % users.length]._id // Cycle through available users
            };
        });

        const createdPosts = await Post.insertMany(postsWithAuthors);
        console.log(`Created ${createdPosts.length} sample posts`);

        console.log('Sample posts created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
