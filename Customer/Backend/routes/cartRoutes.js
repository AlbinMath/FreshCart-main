const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Add Item to Cart
router.post('/add', async (req, res) => {
    try {
        const { userId, item } = req.body;
        console.log("Adding to cart:", userId, item);

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(p => p.productId.toString() === item.productId);

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += item.quantity;
        } else {
            // Add new item
            cart.items.push(item);
        }

        await cart.save();
        res.json({ success: true, cart, message: 'Item added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Cart
router.get('/:userId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) {
            return res.json({ success: true, cart: { items: [] } });
        }
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Quantity
router.put('/update', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            res.json({ success: true, cart });
        } else {
            res.status(404).json({ success: false, message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove Item
router.delete('/remove/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(p => p.productId.toString() !== productId);
        await cart.save();
        res.json({ success: true, cart, message: 'Item removed' });
    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
