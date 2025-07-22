// Remove accents and convert to lowercase
export function normalizeForSearch(str) {
    if (!str) return ''; // Handle null or undefined input
    return str
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove the accents
        .toLowerCase(); // Convert to lowercase
}