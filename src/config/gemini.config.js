const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cấu hình API key
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCRmxypyW011stRt1tM5ibJsIiJRi1bxzo';

// Khởi tạo Google Generative AI với API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Cấu hình model
const geminiConfig = {
    // Tên model Gemini mặc định
    modelName: 'gemini-2.0-flash',

    // Tham số sinh nội dung
    generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
    },

    // Bộ lọc nội dung an toàn
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
    ],
};

// Hàm lấy model Gemini
const getGeminiModel = () => {
    // Lấy model gemini-pro
    return genAI.getGenerativeModel({
        model: geminiConfig.modelName,
        generationConfig: geminiConfig.generationConfig,
        safetySettings: geminiConfig.safetySettings,
    });
};

module.exports = {
    genAI,
    geminiConfig,
    getGeminiModel,
};
