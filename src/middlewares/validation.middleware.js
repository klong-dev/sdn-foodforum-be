const { isValidObjectId } = require('../utils');
const User = require('../models/users.model');
const Category = require('../models/category');


const validatePostNew = async (req, res, next) => {
    const {
        title,
        description,
        thumbnailUrl,
        author,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        ingredients,
        instructions,
        categories
    } = req.body;

    // 1. Required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Title is required and must be a non-empty string.' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ message: 'Description is required and must be a non-empty string.' });
    }
    if (!thumbnailUrl || typeof thumbnailUrl !== 'string' || !thumbnailUrl.trim()) {
        return res.status(400).json({ message: 'thumbnailUrl is required and must be a non-empty string.' });
    }
    if (!categories || !Array.isArray(categories) || categories.length < 1 || categories.length > 3) {
        return res.status(400).json({ message: 'categories is required and must be an array with 1-3 items.' });
    }

    // 2. Author
    if (!author || !isValidObjectId(author)) {
        return res.status(400).json({ message: 'author must be a valid ObjectId.' });
    }
    const authorExists = await User.exists({ _id: author });
    if (!authorExists) {
        return res.status(400).json({ message: 'author does not exist.' });
    }

    // 3. prepTimeMinutes, cookTimeMinutes, servings
    const intFields = [
        { key: 'prepTimeMinutes', value: prepTimeMinutes, min: 0, max: 1440 },
        { key: 'cookTimeMinutes', value: cookTimeMinutes, min: 0, max: 1440 },
        { key: 'servings', value: servings, min: 1, max: 100 }
    ];
    for (const field of intFields) {
        if (!Number.isInteger(field.value)) {
            return res.status(400).json({ message: `${field.key} must be an integer.` });
        }
        if (field.value < field.min || field.value > field.max) {
            return res.status(400).json({ message: `${field.key} must be between ${field.min} and ${field.max}.` });
        }
    }

    // 4. ingredients
    let parsedIngredients = ingredients;
    if (typeof ingredients === 'string') {
        try {
            parsedIngredients = JSON.parse(ingredients);
        } catch {
            return res.status(400).json({ message: 'ingredients must be a valid JSON array.' });
        }
    }
    if (!Array.isArray(parsedIngredients) || parsedIngredients.length < 1 || parsedIngredients.length > 50) {
        return res.status(400).json({ message: 'ingredients must be an array with 1-50 items.' });
    }
    for (const ing of parsedIngredients) {
        if (!ing.name || typeof ing.name !== 'string' || !ing.name.trim() || ing.name.length < 1 || ing.name.length > 100) {
            return res.status(400).json({ message: 'Each ingredient.name is required (1-100 chars).' });
        }
        if (!ing.quantity || typeof ing.quantity !== 'string' || !ing.quantity.trim() || ing.quantity.length < 1 || ing.quantity.length > 50) {
            return res.status(400).json({ message: 'Each ingredient.quantity is required (1-50 chars).' });
        }
        if (ing.imageUrl && !/^https?:\/\/.+\..+/.test(ing.imageUrl)) {
            return res.status(400).json({ message: 'Each ingredient.imageUrl must be a valid URL.' });
        }
        // Trim string fields
        ing.name = ing.name.trim();
        ing.quantity = ing.quantity.trim();
        if (ing.imageUrl) ing.imageUrl = ing.imageUrl.trim();
    }

    // 5. instructions
    let parsedInstructions = instructions;
    if (typeof instructions === 'string') {
        try {
            parsedInstructions = JSON.parse(instructions);
        } catch {
            return res.status(400).json({ message: 'instructions must be a valid JSON array.' });
        }
    }
    if (!Array.isArray(parsedInstructions) || parsedInstructions.length < 1 || parsedInstructions.length > 50) {
        return res.status(400).json({ message: 'instructions must be an array with 1-50 items.' });
    }
    const stepNumbers = new Set();
    let lastStep = 0;
    for (const ins of parsedInstructions) {
        if (typeof ins.stepNumber !== 'number' || ins.stepNumber <= 0 || !Number.isInteger(ins.stepNumber)) {
            return res.status(400).json({ message: 'Each instruction.stepNumber must be a positive integer.' });
        }
        if (stepNumbers.has(ins.stepNumber)) {
            return res.status(400).json({ message: 'Each instruction.stepNumber must be unique.' });
        }
        if (ins.stepNumber <= lastStep) {
            return res.status(400).json({ message: 'instruction.stepNumber must be in ascending order.' });
        }
        stepNumbers.add(ins.stepNumber);
        lastStep = ins.stepNumber;
        if (!ins.stepDescription || typeof ins.stepDescription !== 'string' || ins.stepDescription.length < 1 || ins.stepDescription.length > 2000) {
            return res.status(400).json({ message: 'Each instruction.stepDescription is required (1-2000 chars).' });
        }
        if (ins.imageUrl && !/^https?:\/\/.+\..+/.test(ins.imageUrl)) {
            return res.status(400).json({ message: 'Each instruction.imageUrl must be a valid URL.' });
        }
        // Trim string fields
        ins.stepDescription = ins.stepDescription.trim();
        if (ins.imageUrl) ins.imageUrl = ins.imageUrl.trim();
    }

    // 6. thumbnailUrl: stricter URL check
    req.body.title = title.trim();
    req.body.description = description.trim();
    req.body.thumbnailUrl = thumbnailUrl.trim();

    // 7. categories: ObjectId + exist in DB
    for (const catId of categories) {
        if (!isValidObjectId(catId)) {
            return res.status(400).json({ message: 'Each categoryId must be a valid ObjectId.' });
        }
        const catExists = await Category.exists({ _id: catId });
        if (!catExists) {
            return res.status(400).json({ message: `Category ${catId} does not exist.` });
        }
    }

    // Gán lại các mảng đã parse (nếu cần)
    req.body.ingredients = parsedIngredients;
    req.body.instructions = parsedInstructions;
    req.body.categories = categories;

    next();
};

module.exports = { validatePostNew };