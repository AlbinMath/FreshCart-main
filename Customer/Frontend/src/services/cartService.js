import apiService from './apiService';

export const cartService = {
    addToCart: async (userId, item) => {
        try {
            // item should contain: productId, quantity, etc.
            const response = await apiService.post('/cart/add', { userId, item });
            return response;
        } catch (error) {
            console.error("Error adding to cart:", error);
            throw error;
        }
    },
    getCart: async (userId) => {
        try {
            const response = await apiService.get(`/cart/${userId}`);
            return response;
        } catch (error) {
            console.error("Error fetching cart:", error);
            throw error;
        }
    },
    updateQuantity: async (userId, productId, quantity) => {
        try {
            const response = await apiService.put('/cart/update', { userId, productId, quantity });
            return response;
        } catch (error) {
            console.error("Error updating cart quantity:", error);
            throw error;
        }
    },
    removeFromCart: async (userId, productId) => {
        try {
            const response = await apiService.delete(`/cart/remove/${userId}/${productId}`);
            return response;
        } catch (error) {
            console.error("Error removing from cart:", error);
            throw error;
        }
    }
};
