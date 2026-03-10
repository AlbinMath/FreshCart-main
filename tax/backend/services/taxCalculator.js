const TAX_SLABS = {
    essential: 0,
    basic: 5,
    standard: 12,
    premium: 18,
    luxury: 28,
    default: 18 // Fallback
};

const DELIVERY_GST_RATE = 0; // No GST on delivery
const PLATFORM_FEE_GST_RATE = 0; // No GST on platform fees
const TCS_RATE = 1; // 1% TCS (0.5% CGST + 0.5% SGST)

/**
 * Calculate tax for a single item (now taking into account prorated discount)
 */
const calculateItemTax = (item, proratedDiscount = 0) => {
    const rate = TAX_SLABS[item.category] !== undefined ? TAX_SLABS[item.category] : TAX_SLABS.default;
    const qty = item.quantity || 1;
    const grossTotal = item.price * qty;

    // Taxable Value is gross total minus prorated discount
    const taxableValue = Math.max(0, grossTotal - proratedDiscount);

    const taxAmount = (taxableValue * rate) / 100;

    return {
        ...item,
        taxRate: rate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        cgst: parseFloat((taxAmount / 2).toFixed(2)),
        sgst: parseFloat((taxAmount / 2).toFixed(2)),
        totalPrice: parseFloat((taxableValue + taxAmount).toFixed(2)),
        proratedDiscount: parseFloat(proratedDiscount.toFixed(2))
    };
};

/**
 * Main calculation function
 */
const calculateOrderTax = (payload) => {
    const { items, deliveryFee = 0, platformFee = 0, orderDiscount = 0, isInterState = false } = payload;

    // Calculate Gross Product Value first for prorating
    let grossProductValue = 0;
    items.forEach(item => {
        grossProductValue += item.price * (item.quantity || 1);
    });

    // 1. Product Taxes with Prorated Discount
    let totalTaxableProductValue = 0;
    let totalProductTax = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    // Cap total discount to not exceed gross value
    const appliedDiscount = Math.min(orderDiscount, grossProductValue);

    const processedItems = items.map(item => {
        const itemGross = item.price * (item.quantity || 1);
        let itemProratedDiscount = 0;

        if (grossProductValue > 0) {
            itemProratedDiscount = (itemGross / grossProductValue) * appliedDiscount;
        }

        const calculated = calculateItemTax(item, itemProratedDiscount);

        totalProductTax += calculated.taxAmount;
        totalTaxableProductValue += Math.max(0, itemGross - itemProratedDiscount);
        totalCGST += calculated.cgst;
        totalSGST += calculated.sgst;

        return calculated;
    });

    // 2. Delivery Tax (0% - No tax)
    const deliveryTax = (deliveryFee * DELIVERY_GST_RATE) / 100;

    // 3. Platform Fee Tax (0% - No tax)
    const platformTax = (platformFee * PLATFORM_FEE_GST_RATE) / 100;

    // 4. TCS Calculation (1% on Net Value of Taxable Supplies)
    const tcsAmount = (totalTaxableProductValue * TCS_RATE) / 100;

    const totalGST = totalProductTax + deliveryTax + platformTax;
    const grandTotal = totalTaxableProductValue + deliveryFee + platformFee + totalGST + tcsAmount;

    return {
        breakdown: {
            items: processedItems,
            delivery: {
                value: deliveryFee,
                rate: DELIVERY_GST_RATE,
                tax: parseFloat(deliveryTax.toFixed(2))
            },
            platformFee: {
                value: platformFee,
                rate: PLATFORM_FEE_GST_RATE,
                tax: parseFloat(platformTax.toFixed(2))
            },
            tcs: {
                rate: TCS_RATE,
                amount: parseFloat(tcsAmount.toFixed(2))
            },
            discountApplied: parseFloat(appliedDiscount.toFixed(2))
        },
        totals: {
            subtotal: parseFloat(grossProductValue.toFixed(2)), // Keep original subtotal visible
            taxableSubtotal: parseFloat(totalTaxableProductValue.toFixed(2)), // Value after discount
            totalTax: parseFloat(totalGST.toFixed(2)),
            totalCGST: parseFloat(totalCGST.toFixed(2)),
            totalSGST: parseFloat(totalSGST.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2))
        }
    };
};

module.exports = {
    calculateOrderTax,
    TAX_SLABS
};
