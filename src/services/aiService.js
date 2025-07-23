const { getGeminiModel } = require('../config/gemini.config');
const Post = require('../models/posts.model');
const Category = require('../models/category.model');

/**
 * Service xử lý các yêu cầu AI sử dụng Gemini
 */
const AIService = {
    /**
     * Tạo prompt cho Gemini dựa trên dữ liệu và yêu cầu của người dùng
     * @param {string} userQuestion Câu hỏi của người dùng
     * @param {Array} posts Danh sách bài đăng (nếu đã có)
     * @param {Object} context Ngữ cảnh bổ sung
     * @returns {string} Prompt được tạo cho Gemini
     */
    createPrompt: async (userQuestion, posts = [], context = {}) => {
        // Nếu không có posts sẵn có, lấy một số bài đăng từ DB
        let postsData = posts;
        if (!postsData || postsData.length === 0) {
            try {
                // Giới hạn số lượng bài đăng để tránh quá tải prompt
                postsData = await Post.find({ status: 'active' })
                    .populate('category')
                    .populate('author', 'username')
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean();
            } catch (error) {
                console.error('Error fetching posts for AI prompt:', error);
                postsData = [];
            }
        }

        // Lấy danh sách category
        let categories = [];
        try {
            categories = await Category.find({ status: 'active' }).lean();
        } catch (error) {
            console.error('Error fetching categories for AI prompt:', error);
        }

        // Tạo ngữ cảnh cho AI
        const postContext = postsData.map(post => ({
            id: post._id.toString(),
            title: post.title,
            content: post.content?.substring(0, 150) || '',
            category: post.category?.name || 'Uncategorized',
            recipe: post.recipe ? {
                difficulty: post.recipe.difficulty,
                prepTime: post.recipe.prepTime,
                cookTime: post.recipe.cookTime,
                servings: post.recipe.servings,
                ingredients: post.recipe.ingredients?.slice(0, 5) || []
            } : null
        }));

        // Tạo prompt hoàn chỉnh
        return `
Bạn là trợ lý AI của Food Forum, một cộng đồng chia sẻ các công thức nấu ăn và thảo luận về ẩm thực. 
Hãy trả lời câu hỏi của người dùng dựa trên dữ liệu có sẵn.

CÁC DANH MỤC TRONG HỆ THỐNG:
${categories.map(cat => `- ${cat.name}: ${cat.description || 'Không có mô tả'}`).join('\n')}

DỮ LIỆU BÀI ĐĂNG CÓ SẴN:
${postContext.map(post =>
            `ID: ${post.id}
    Tiêu đề: ${post.title}
    Danh mục: ${post.category}
    ${post.recipe ? `Độ khó: ${post.recipe.difficulty}, Thời gian chuẩn bị: ${post.recipe.prepTime} phút, Thời gian nấu: ${post.recipe.cookTime} phút, Khẩu phần: ${post.recipe.servings}` : ''}
    ${post.recipe && post.recipe.ingredients.length > 0 ? `Nguyên liệu: ${post.recipe.ingredients.join(', ')}` : ''}
    Nội dung: ${post.content}`
        ).join('\n\n')}

CÂU HỎI CỦA NGƯỜI DÙNG: ${userQuestion}

HƯỚNG DẪN PHẢN HỒI:
1. Hãy tìm kiếm trong dữ liệu bài đăng để đưa ra phản hồi phù hợp.

2. QUAN TRỌNG: Khi đề xuất món ăn, bạn PHẢI sử dụng định dạng thẻ/card thay vì liên kết. 
   MỖI MÓN ĂN bạn đề xuất PHẢI được đặt trong định dạng sau:
   
   CARD_START
   {
     "id": "ID_bài_đăng",
     "title": "Tiêu đề món ăn",
     "difficulty": "Độ khó (nếu có)",
     "prepTime": "Thời gian chuẩn bị (nếu có)",
     "cookTime": "Thời gian nấu (nếu có)",
     "category": "Danh mục"
   }
   CARD_END
   
   KHÔNG sử dụng định dạng "post/ID" hoặc "(post/ID)". Thay vào đó, LUÔN sử dụng định dạng card ở trên.

3. Có thể đề xuất nhiều món ăn (tối đa 3 thẻ) nếu phù hợp với câu hỏi.

4. Trả lời ngắn gọn, rõ ràng và thân thiện.

5. Nếu không có thông tin phù hợp, hãy gợi ý người dùng tạo bài đăng mới để chia sẻ công thức.

6. Trả lời bằng Tiếng Việt, trừ khi người dùng hỏi bằng tiếng Anh.

Phản hồi của bạn:
`;
    },

    /**
     * Gửi câu hỏi đến Gemini và nhận phản hồi
     * @param {string} question Câu hỏi của người dùng
     * @param {Object} context Ngữ cảnh bổ sung
     * @returns {Object} Phản hồi từ Gemini
     */
    sendQuestion: async (question, context = {}) => {
        try {
            const model = getGeminiModel();

            // Tạo prompt dựa trên dữ liệu
            const prompt = await AIService.createPrompt(question, context.posts || [], context);

            // Gửi prompt đến Gemini
            const result = await model.generateContent(prompt);

            // Trích xuất phản hồi
            const text = result.response.text();

            return {
                content: text,
                model: 'gemini-pro',
                prompt,
            };
        } catch (error) {
            console.error('Error sending question to Gemini:', error);
            throw error;
        }
    }
};

module.exports = AIService;
