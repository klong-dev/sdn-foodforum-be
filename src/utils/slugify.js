const Post = require('../models/posts'); // Đảm bảo đường dẫn này đúng tới Mongoose Model của bạn

/**
 * Chuẩn hóa một chuỗi văn bản để tạo slug thân thiện với URL.
 * Bao gồm chuyển đổi sang chữ thường, loại bỏ dấu tiếng Việt, thay thế khoảng trắng bằng dấu gạch ngang,
 * và loại bỏ các ký tự đặc biệt không mong muốn.
 *
 * @param {string} str Chuỗi đầu vào (ví dụ: tiêu đề bài viết).
 * @returns {string} Chuỗi đã được chuẩn hóa, sẵn sàng làm slug.
 */
function normalizeStringForSlug(str) {
    if (!str || typeof str !== 'string') {
        return ''; // Xử lý các giá trị null, undefined, hoặc không phải chuỗi
    }

    return str
        .normalize("NFD") // Tách các ký tự có dấu thành ký tự cơ bản và dấu (ví dụ: 'á' -> 'a' + '́')
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu đã tách
        .toLowerCase() // Chuyển toàn bộ chuỗi sang chữ thường
        .replace(/[^a-z0-9\s-]/g, "") // Loại bỏ các ký tự không phải chữ cái (a-z), số (0-9), khoảng trắng hoặc dấu gạch ngang
        .replace(/\s+/g, '-') // Thay thế một hoặc nhiều khoảng trắng bằng một dấu gạch ngang đơn
        .replace(/-+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu gạch ngang đơn
        .trim() // Xóa khoảng trắng (hoặc dấu gạch ngang nếu chúng xuất hiện do lỗi) ở đầu và cuối chuỗi
        .replace(/^-+|-+$/g, ''); // Xóa các dấu gạch ngang ở đầu hoặc cuối chuỗi (nếu có)
}

/**
 * Đảm bảo một slug là duy nhất trong collection 'Post'.
 * Nếu slug cơ bản đã tồn tại, hàm sẽ thêm một số đếm tuần tự (ví dụ: 'mon-an-ngon-2') cho đến khi tìm được một slug duy nhất.
 *
 * @param {string} title Tiêu đề gốc của bài viết.
 * @param {string | null} [currentPostId=null] Tùy chọn. ID của bài viết đang được cập nhật.
 * Bài viết này sẽ được loại trừ khỏi quá trình kiểm tra duy nhất
 * để tránh xung đột với chính nó.
 * @returns {Promise<string>} Một Promise sẽ phân giải với slug duy nhất.
 * @throws {Error} Ném lỗi nếu `Post` model không được import đúng cách hoặc truy vấn database thất bại.
 */
async function ensureUniqueSlug(title, currentPostId = null) {
    if (!title || typeof title !== 'string') {
        throw new Error("Tiêu đề phải là một chuỗi không rỗng để tạo slug.");
    }

    let baseSlug = normalizeStringForSlug(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
        let query = { slug: finalSlug };

        // Nếu đang cập nhật một bài viết hiện có, loại trừ chính bài viết đó khỏi kiểm tra trùng lặp
        if (currentPostId) {
            query._id = { $ne: currentPostId }; // $ne nghĩa là "không bằng"
        }

        try {
            const existingPost = await Post.findOne(query);

            if (!existingPost) {
                // Không tìm thấy bài viết nào hiện có với slug này (hoặc đó là bài viết đang được cập nhật)
                return finalSlug; // Slug này là duy nhất!
            }

            // Tìm thấy slug trùng lặp, thêm số đếm và thử lại
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        } catch (error) {
            console.error("Lỗi khi kiểm tra tính duy nhất của slug trong database:", error);
            // Ném lại lỗi để được xử lý bởi hàm gọi (ví dụ: controller)
            throw new Error("Không thể đảm bảo slug duy nhất do lỗi database.");
        }
    }
}

// Export các hàm để chúng có thể được sử dụng trong các file khác bằng `require`
module.exports = {
    ensureUniqueSlug,
    normalizeStringForSlug
};