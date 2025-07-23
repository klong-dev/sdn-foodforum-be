const AIService = require('../services/aiService');

/**
 * Controller xử lý các yêu cầu liên quan đến AI
 */
const AIController = {
    /**
     * Xử lý yêu cầu chat với AI
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    chat: async (req, res) => {
        try {
            const { question, context = {} } = req.body;

            if (!question) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu câu hỏi. Vui lòng cung cấp trường "question".'
                });
            }

            // Gửi câu hỏi đến service AI
            const response = await AIService.sendQuestion(question, context);

            return res.status(200).json({
                success: true,
                content: response.content,
                model: response.model
            });
        } catch (error) {
            console.error('Error in AI chat controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xử lý yêu cầu AI.',
                error: error.message
            });
        }
    }
};

module.exports = AIController;
