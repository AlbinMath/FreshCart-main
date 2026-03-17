try {
    const lucide = require('lucide-react');
    if (lucide.IdCard) {
        console.log('IdCard found!');
    } else {
        console.log('IdCard NOT found. Available icons:', Object.keys(lucide).slice(0, 5));
    }
} catch (e) {
    console.error(e);
}
