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
 * Calculate tax for a single item
 */
const calculateItemTax = (item) => {
    const rate = TAX_SLABS[item.category] !== undefined ? TAX_SLABS[item.category] : TAX_SLABS.default;
    const taxableValue = item.price; // Assuming price is exclusive of tax for calculation base, or handle inclusive logic if needed. 
    // For this generic implementation, we assume price is the taxable value.

    const taxAmount = (taxableValue * rate) / 100;

    return {
        ...item,
        taxRate: rate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        cgst: parseFloat((taxAmount / 2).toFixed(2)),
        sgst: parseFloat((taxAmount / 2).toFixed(2)), // Assuming intra-state for simplicity unless IGST param provided
        totalPrice: parseFloat((taxableValue + taxAmount).toFixed(2))
    };
};

/**
 * Main calculation function
 */
const calculateOrderTax = (payload) => {
    const { items, deliveryFee = 0, platformFee = 0, isInterState = false } = payload;

    // 1. Product Taxes
    let totalProductTax = 0;
    let totalProductValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    const processedItems = items.map(item => {
        const calculated = calculateItemTax(item);
        totalProductTax += calculated.taxAmount;
        totalProductValue += item.price;
        totalCGST += calculated.cgst;
        totalSGST += calculated.sgst;
        return calculated;
    });

    // 2. Delivery Tax (0% - No tax)
    const deliveryTax = (deliveryFee * DELIVERY_GST_RATE) / 100;

    // 3. Platform Fee Tax (0% - No tax)
    const platformTax = (platformFee * PLATFORM_FEE_GST_RATE) / 100;

    // 4. TCS Calculation (1% on Net Value of Taxable Supplies)
    // TCS is collected on the value of goods (excluding tax)
    const tcsAmount = (totalProductValue * TCS_RATE) / 100;

    const totalGST = totalProductTax + deliveryTax + platformTax;
    const grandTotal = totalProductValue + deliveryFee + platformFee + totalGST + tcsAmount;

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
            }
        },
        totals: {
            subtotal: parseFloat(totalProductValue.toFixed(2)),
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
