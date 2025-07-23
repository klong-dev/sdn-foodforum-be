const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/users.model');
const Post = require('./src/models/posts.model');
const Comment = require('./src/models/comment.model');
const Vote = require('./src/models/vote.model');
const Category = require('./src/models/category.model');
const PostImage = require('./src/models/postImages.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdn-foodforum', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Fake user data
const fakeUsers = [
    {
        username: 'foodie_master',
        email: 'foodie@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'chef_extraordinaire',
        email: 'chef@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'home_cook_hero',
        email: 'homecook@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'baking_queen',
        email: 'baker@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'spice_lover',
        email: 'spicy@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'healthy_eater',
        email: 'healthy@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'dessert_demon',
        email: 'dessert@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    },
    {
        username: 'grill_master',
        email: 'grill@example.com',
        password: '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjPiKXeT6.1w0oEn0LBaI1g6R3/JY6', // password123
        role: 'user',
        favoritePost: []
    }
];

// Fake categories
const fakeCategories = [
    {
        name: 'Quick Meals',
        description: 'Fast and easy meal ideas for busy people',
        color: '#06B6D4',
        icon: '⚡',
        subreddit: 'r/quickmeals',
        status: 'active',
        postCount: 0
    },
    {
        name: 'Healthy Eating',
        description: 'Nutritious and wholesome food choices',
        color: '#22C55E',
        icon: '🥗',
        subreddit: 'r/healthyeating',
        status: 'active',
        postCount: 0
    },
    {
        name: 'Baking & Desserts',
        description: 'Sweet treats and baked goods',
        color: '#EC4899',
        icon: '🍰',
        subreddit: 'r/baking',
        status: 'active',
        postCount: 0
    },
    {
        name: 'International Cuisine',
        description: 'Dishes from around the world',
        color: '#7C3AED',
        icon: '🌍',
        subreddit: 'r/international',
        status: 'active',
        postCount: 0
    },
    {
        name: 'Comfort Food',
        description: 'Hearty and satisfying comfort dishes',
        color: '#F97316',
        icon: '🍲',
        subreddit: 'r/comfortfood',
        status: 'active',
        postCount: 0
    }
];

// Fake posts with recipes
const fakePosts = [
    {
        title: '🍝 Creamy Garlic Parmesan Pasta',
        content: 'This incredibly creamy and flavorful pasta dish comes together in just 20 minutes! Perfect for a weeknight dinner that feels fancy.',
        recipe: {
            prepTime: '10 minutes',
            cookTime: '15 minutes',
            servings: '4 people',
            difficulty: 'Easy',
            ingredients: [
                '1 lb fettuccine pasta',
                '4 cloves garlic, minced',
                '1/2 cup butter',
                '1 cup heavy cream',
                '1 cup freshly grated Parmesan cheese',
                '1/2 cup pasta water',
                'Salt and pepper to taste',
                'Fresh parsley for garnish'
            ],
            instructions: [
                'Cook pasta according to package directions until al dente',
                'Reserve 1/2 cup pasta water before draining',
                'In a large skillet, melt butter and sauté garlic until fragrant',
                'Add heavy cream and bring to a gentle simmer',
                'Gradually whisk in Parmesan cheese until smooth',
                'Add cooked pasta and toss with sauce',
                'Add pasta water if needed to achieve desired consistency',
                'Season with salt and pepper, garnish with parsley'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🥗 Mediterranean Quinoa Bowl',
        content: 'A vibrant and nutritious bowl packed with fresh vegetables, protein-rich quinoa, and a tangy lemon herb dressing.',
        recipe: {
            prepTime: '15 minutes',
            cookTime: '20 minutes',
            servings: '2 people',
            difficulty: 'Easy',
            ingredients: [
                '1 cup quinoa',
                '2 cups vegetable broth',
                '1 cucumber, diced',
                '1 cup cherry tomatoes, halved',
                '1/2 red onion, thinly sliced',
                '1/2 cup kalamata olives',
                '1/2 cup feta cheese, crumbled',
                '1/4 cup olive oil',
                '2 tbsp lemon juice',
                '1 tsp dried oregano',
                'Fresh mint and parsley'
            ],
            instructions: [
                'Rinse quinoa under cold water until water runs clear',
                'Combine quinoa and broth in a saucepan, bring to boil',
                'Reduce heat, cover and simmer for 15 minutes',
                'Let quinoa cool completely',
                'Prepare all vegetables and herbs',
                'Whisk together olive oil, lemon juice, and oregano',
                'Combine quinoa with vegetables in a large bowl',
                'Drizzle with dressing and top with feta and herbs'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🍰 Classic Chocolate Chip Cookies',
        content: 'The ultimate chocolate chip cookie recipe that produces perfectly chewy cookies with crispy edges every single time.',
        recipe: {
            prepTime: '15 minutes',
            cookTime: '12 minutes',
            servings: '24 cookies',
            difficulty: 'Easy',
            ingredients: [
                '2 1/4 cups all-purpose flour',
                '1 tsp baking soda',
                '1 tsp salt',
                '1 cup butter, softened',
                '3/4 cup granulated sugar',
                '3/4 cup brown sugar, packed',
                '2 large eggs',
                '2 tsp vanilla extract',
                '2 cups chocolate chips'
            ],
            instructions: [
                'Preheat oven to 375°F (190°C)',
                'Mix flour, baking soda, and salt in a bowl',
                'Cream butter and both sugars until light and fluffy',
                'Beat in eggs and vanilla extract',
                'Gradually add flour mixture until just combined',
                'Stir in chocolate chips',
                'Drop rounded tablespoons onto ungreased baking sheets',
                'Bake for 9-11 minutes until golden brown'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🌮 Authentic Fish Tacos',
        content: 'Fresh, flaky fish with a crispy coating, topped with crunchy slaw and creamy cilantro lime sauce in warm tortillas.',
        recipe: {
            prepTime: '20 minutes',
            cookTime: '15 minutes',
            servings: '4 people',
            difficulty: 'Intermediate',
            ingredients: [
                '1 lb white fish fillets (mahi-mahi or cod)',
                '1 cup all-purpose flour',
                '1 tsp chili powder',
                '1/2 tsp cumin',
                '8 corn tortillas',
                '2 cups cabbage, shredded',
                '1/4 cup red onion, diced',
                '1/2 cup sour cream',
                '2 tbsp lime juice',
                '1/4 cup cilantro, chopped',
                'Hot sauce to taste'
            ],
            instructions: [
                'Season fish with salt, pepper, chili powder, and cumin',
                'Dredge fish in flour and fry until golden and flaky',
                'Warm tortillas in a dry skillet',
                'Mix cabbage and red onion for slaw',
                'Combine sour cream, lime juice, and cilantro for sauce',
                'Flake fish into bite-sized pieces',
                'Assemble tacos with fish, slaw, and sauce',
                'Serve with lime wedges and hot sauce'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🍲 Hearty Beef Stew',
        content: 'A warming, soul-satisfying beef stew with tender chunks of beef, vegetables, and rich gravy. Perfect for cold winter days.',
        recipe: {
            prepTime: '30 minutes',
            cookTime: '2 hours',
            servings: '6 people',
            difficulty: 'Intermediate',
            ingredients: [
                '2 lbs beef chuck, cut into 2-inch pieces',
                '3 tbsp olive oil',
                '1 large onion, diced',
                '3 carrots, sliced',
                '3 celery stalks, chopped',
                '3 potatoes, cubed',
                '3 cloves garlic, minced',
                '3 tbsp tomato paste',
                '1/4 cup flour',
                '4 cups beef broth',
                '2 bay leaves',
                'Fresh thyme sprigs'
            ],
            instructions: [
                'Season beef with salt and pepper, coat lightly with flour',
                'Heat oil in a Dutch oven and brown beef on all sides',
                'Remove beef and sauté onions until translucent',
                'Add garlic and tomato paste, cook for 1 minute',
                'Return beef to pot, add broth and herbs',
                'Bring to boil, then reduce heat and simmer covered for 1 hour',
                'Add vegetables and continue cooking for 45 minutes',
                'Remove bay leaves and adjust seasoning before serving'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🍜 Homemade Chicken Ramen',
        content: 'Rich, flavorful ramen with tender chicken, soft-boiled eggs, and fresh vegetables in a deeply satisfying broth.',
        recipe: {
            prepTime: '45 minutes',
            cookTime: '3 hours',
            servings: '4 people',
            difficulty: 'Advanced',
            ingredients: [
                '2 lbs chicken bones',
                '1 lb chicken thighs',
                '1 onion, quartered',
                '3 cloves garlic',
                '1 piece ginger (2 inches)',
                '4 portions fresh ramen noodles',
                '4 soft-boiled eggs',
                '2 green onions, sliced',
                '1 sheet nori, cut into strips',
                '1 cup bamboo shoots',
                'Miso paste to taste'
            ],
            instructions: [
                'Roast chicken bones at 400°F for 30 minutes',
                'Transfer bones to large pot with 12 cups water',
                'Add onion, garlic, and ginger to pot',
                'Simmer broth for 2-3 hours, skimming foam regularly',
                'In separate pot, cook chicken thighs until tender',
                'Strain broth and season with miso paste',
                'Cook ramen noodles according to package directions',
                'Assemble bowls with noodles, chicken, eggs, and garnishes'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🥞 Fluffy Buttermilk Pancakes',
        content: 'Light, fluffy pancakes that are crispy on the outside and tender on the inside. The perfect weekend breakfast treat!',
        recipe: {
            prepTime: '10 minutes',
            cookTime: '15 minutes',
            servings: '4 people',
            difficulty: 'Easy',
            ingredients: [
                '2 cups all-purpose flour',
                '2 tbsp sugar',
                '2 tsp baking powder',
                '1/2 tsp salt',
                '2 large eggs',
                '1 3/4 cups buttermilk',
                '1/4 cup melted butter',
                '1 tsp vanilla extract',
                'Butter for cooking',
                'Maple syrup for serving'
            ],
            instructions: [
                'Whisk together flour, sugar, baking powder, and salt',
                'In separate bowl, beat eggs and add buttermilk, melted butter, and vanilla',
                'Pour wet ingredients into dry ingredients and mix until just combined',
                'Let batter rest for 5 minutes (lumps are okay)',
                'Heat griddle or pan over medium heat and add butter',
                'Pour 1/4 cup batter per pancake onto hot surface',
                'Cook until bubbles form on surface, then flip',
                'Cook until golden brown and serve hot with syrup'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    },
    {
        title: '🍕 Homemade Margherita Pizza',
        content: 'Authentic Neapolitan-style pizza with a perfectly chewy crust, fresh mozzarella, and aromatic basil.',
        recipe: {
            prepTime: '2 hours',
            cookTime: '10 minutes',
            servings: '2 pizzas',
            difficulty: 'Intermediate',
            ingredients: [
                '3 cups bread flour',
                '1 1/4 cups warm water',
                '2 tsp active dry yeast',
                '2 tsp salt',
                '2 tbsp olive oil',
                '1 can crushed tomatoes (14 oz)',
                '8 oz fresh mozzarella, sliced',
                'Fresh basil leaves',
                'Extra virgin olive oil for drizzling',
                'Sea salt for finishing'
            ],
            instructions: [
                'Dissolve yeast in warm water and let foam for 5 minutes',
                'Mix flour and salt, then add yeast mixture and olive oil',
                'Knead dough for 8-10 minutes until smooth and elastic',
                'Place in oiled bowl, cover, and rise for 1 hour',
                'Divide dough in half and shape into pizza rounds',
                'Top with crushed tomatoes, leaving border for crust',
                'Add mozzarella slices and bake at 500°F for 8-10 minutes',
                'Finish with fresh basil, olive oil, and sea salt'
            ]
        },
        status: 'active',
        votes: 0,
        commentCount: 0
    }
];

// Fake comments
const fakeCommentsTemplates = [
    'This looks absolutely delicious! Can\'t wait to try it.',
    'I made this last night and it was amazing! My family loved it.',
    'Great recipe! I substituted {ingredient} and it turned out perfect.',
    'This is now my go-to recipe for {dish}. Thank you for sharing!',
    'The instructions were so clear and easy to follow.',
    'I\'ve been looking for a recipe like this forever. Finally found it!',
    'Made a few modifications but the base recipe is solid.',
    'This brought back childhood memories. Exactly like my grandmother used to make.',
    'Perfect for meal prep! I made a big batch.',
    'The flavors in this dish are incredible. Restaurant quality!',
    'Quick question - can I use {ingredient} instead of {ingredient}?',
    'This was my first time making {dish} and it was a success!',
    'I added some extra spice and it was perfect for my taste.',
    'Bookmarking this recipe for sure. Looks amazing!',
    'The presentation tips really helped make this look professional.',
    'I halved the recipe and it still turned out great.',
    'This is comfort food at its finest. Love it!',
    'The prep time was spot on. Very manageable for a weeknight.',
    'I\'m definitely making this for my next dinner party.',
    'Simple ingredients but such complex flavors. Well done!'
];

async function seedFakeData() {
    try {
        console.log('🌱 Starting to seed fake data...');

        // Clear existing data
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await Vote.deleteMany({});
        await Category.deleteMany({});
        await PostImage.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // Create categories first
        const categories = await Category.insertMany(fakeCategories);
        console.log(`✅ Created ${categories.length} categories`);

        // Create users
        const users = await User.insertMany(fakeUsers);
        console.log(`✅ Created ${users.length} users`);

        // Create posts with random authors and categories
        const postsWithAuthors = fakePosts.map(post => ({
            ...post,
            author: users[Math.floor(Math.random() * users.length)]._id,
            category: categories[Math.floor(Math.random() * categories.length)]._id,
            images: [] // Will be populated later if needed
        }));

        const posts = await Post.insertMany(postsWithAuthors);
        console.log(`✅ Created ${posts.length} posts`);

        // Create fake images for some posts
        const postImages = [];
        const imageUrls = [
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
            'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
            'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
            'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800'
        ];

        for (let i = 0; i < posts.length; i++) {
            if (Math.random() > 0.3) { // 70% chance of having an image
                const imageData = {
                    post: posts[i]._id,
                    url: imageUrls[i % imageUrls.length]
                };
                const image = await PostImage.create(imageData);
                postImages.push(image);

                // Update post with image reference
                await Post.findByIdAndUpdate(posts[i]._id, {
                    $push: { images: image._id }
                });
            }
        }
        console.log(`✅ Created ${postImages.length} post images`);

        // Create comments
        const comments = [];
        for (let post of posts) {
            const numComments = Math.floor(Math.random() * 8) + 1; // 1-8 comments per post

            for (let i = 0; i < numComments; i++) {
                const comment = {
                    post_id: post._id,
                    user_id: users[Math.floor(Math.random() * users.length)]._id,
                    content: fakeCommentsTemplates[Math.floor(Math.random() * fakeCommentsTemplates.length)],
                    parent_id: null // For now, no nested comments
                };
                comments.push(comment);
            }
        }

        const createdComments = await Comment.insertMany(comments);
        console.log(`✅ Created ${createdComments.length} comments`);

        // Update post comment counts
        for (let post of posts) {
            const commentCount = createdComments.filter(c => c.post_id.toString() === post._id.toString()).length;
            await Post.findByIdAndUpdate(post._id, { commentCount });
        }

        // Create votes for posts and comments
        const votes = [];

        // Votes for posts
        for (let post of posts) {
            const numVoters = Math.floor(Math.random() * users.length); // Random number of voters
            const voterIds = [...users].sort(() => 0.5 - Math.random()).slice(0, numVoters);

            for (let voter of voterIds) {
                const voteType = Math.random() > 0.7 ? 'downvote' : 'upvote'; // 70% upvotes, 30% downvotes
                votes.push({
                    user_id: voter._id,
                    target_id: post._id,
                    target_type: 'post',
                    vote_type: voteType
                });
            }
        }

        // Votes for comments
        for (let comment of createdComments) {
            const numVoters = Math.floor(Math.random() * 5); // 0-4 voters per comment
            const voterIds = [...users].sort(() => 0.5 - Math.random()).slice(0, numVoters);

            for (let voter of voterIds) {
                const voteType = Math.random() > 0.6 ? 'downvote' : 'upvote'; // 60% upvotes, 40% downvotes
                votes.push({
                    user_id: voter._id,
                    target_id: comment._id,
                    target_type: 'comment',
                    vote_type: voteType
                });
            }
        }

        const createdVotes = await Vote.insertMany(votes);
        console.log(`✅ Created ${createdVotes.length} votes`);

        // Update post vote counts
        for (let post of posts) {
            const postVotes = createdVotes.filter(v => v.target_id.toString() === post._id.toString());
            const upvotes = postVotes.filter(v => v.vote_type === 'upvote').length;
            const downvotes = postVotes.filter(v => v.vote_type === 'downvote').length;
            const netVotes = upvotes - downvotes;

            await Post.findByIdAndUpdate(post._id, { votes: netVotes });
        }

        // Update category post counts
        for (let category of categories) {
            const categoryPosts = posts.filter(p => p.category.toString() === category._id.toString());
            await Category.findByIdAndUpdate(category._id, { postCount: categoryPosts.length });
        }

        console.log('🎉 Fake data seeding completed successfully!');
        console.log(`
📊 Summary:
   👥 Users: ${users.length}
   📝 Posts: ${posts.length}
   💬 Comments: ${createdComments.length}
   👍 Votes: ${createdVotes.length}
   📷 Images: ${postImages.length}
   🏷️  Categories: ${categories.length}
        `);

    } catch (error) {
        console.error('❌ Error seeding fake data:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seeding function
seedFakeData();
