/**
 * Controller for home-related routes
 */

/**
 * Render the homepage with featured content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getHomePage = (req, res) => {
    // In a real application, you would fetch this data from your database
    const featuredRecipes = [
        {
            id: 1,
            title: 'Homemade Pasta Carbonara',
            description: 'A creamy classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.',
            time: '30 mins',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?q=80&w=500&auto=format&fit=crop',
            author: 'Sophie Martin',
            authorImage: 'https://randomuser.me/api/portraits/women/12.jpg',
            trending: true
        },
        {
            id: 2,
            title: 'Stone-Baked Pizza Margherita',
            description: 'The perfect pizza with a crispy base, tangy tomato sauce, fresh mozzarella, and basil.',
            time: '45 mins',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=500&auto=format&fit=crop',
            author: 'Marco Rossi',
            authorImage: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        {
            id: 3,
            title: 'Vanilla Bean Cheesecake',
            description: 'Creamy cheesecake with a buttery graham cracker crust and fresh seasonal berries.',
            time: '1 hour',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=500&auto=format&fit=crop',
            author: 'Emma Johnson',
            authorImage: 'https://randomuser.me/api/portraits/women/65.jpg'
        },
        {
            id: 4,
            title: 'Thai Green Curry',
            description: 'Authentic Thai curry with coconut milk, fresh vegetables, and aromatic herbs.',
            time: '50 mins',
            rating: 4.6,
            image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?q=80&w=500&auto=format&fit=crop',
            author: 'David Chen',
            authorImage: 'https://randomuser.me/api/portraits/men/45.jpg',
            isNew: true
        }
    ];

    const categories = [
        {
            id: 1,
            name: 'Italian Cuisine',
            description: 'Explore traditional pasta recipes, authentic pizza techniques, and classic Italian desserts.',
            image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=600&auto=format&fit=crop',
            slug: 'italian'
        },
        {
            id: 2,
            name: 'Asian Cuisine',
            description: 'Discover the rich flavors of Asian cooking from stir-fries to exotic spices and sushi techniques.',
            image: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?q=80&w=600&auto=format&fit=crop',
            slug: 'asian'
        },
        {
            id: 3,
            name: 'Desserts',
            description: 'Satisfy your sweet tooth with our collection of cakes, pastries, and other delightful treats.',
            image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?q=80&w=600&auto=format&fit=crop',
            slug: 'desserts'
        }
    ];

    const discussions = [
        {
            id: 1,
            title: 'Best way to store fresh herbs?',
            content: 'I always struggle to keep my herbs fresh. Any tips on how to make them last longer?',
            author: 'Jamie T.',
            replies: 14,
            views: 234,
            postedDaysAgo: 2
        },
        {
            id: 2,
            title: 'Cast iron vs. non-stick pans?',
            content: 'I\'m looking to invest in some quality cookware. Which type of pan do you recommend and why?',
            author: 'Alex W.',
            replies: 23,
            views: 346,
            postedDaysAgo: 3
        },
        {
            id: 3,
            title: 'What\'s your go-to weeknight dinner?',
            content: 'Looking for quick and easy dinner ideas that don\'t compromise on flavor!',
            author: 'Sarah K.',
            replies: 18,
            views: 289,
            postedDaysAgo: 4
        }
    ];

    const forumCategories = [
        { name: 'Cooking Tips', count: 42, slug: 'cooking-tips' },
        { name: 'Recipes', count: 28, slug: 'recipes' },
        { name: 'Kitchen Equipment', count: 16, slug: 'equipment' }
    ];

    res.render('home/index', {
        title: 'Home - Food Forum',
        featuredRecipes,
        categories,
        discussions,
        forumCategories,
        isAuthenticated: req.session?.user ? true : false,
        user: req.session?.user
    });
};

/**
 * Render the about page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAboutPage = (req, res) => {
    res.render('home/about', {
        title: 'About Us - Food Forum',
        isAuthenticated: req.session?.user ? true : false,
        user: req.session?.user
    });
};

/**
 * Render the contact page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getContactPage = (req, res) => {
    res.render('home/contact', {
        title: 'Contact Us - Food Forum',
        isAuthenticated: req.session?.user ? true : false,
        user: req.session?.user
    });
};

/**
 * Process the newsletter subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.subscribeToNewsletter = (req, res) => {
    const { email } = req.body;

    // In a real application, you would save this to a database
    // and possibly integrate with a newsletter service like Mailchimp

    // For now, just redirect back with a success message
    req.session.flashMessage = {
        type: 'success',
        text: 'Thanks for subscribing to our newsletter!'
    };

    res.redirect('/');
};