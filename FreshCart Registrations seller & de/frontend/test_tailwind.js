try {
    const tailwind = require('tailwindcss');
    console.log('Tailwind loaded successfully');
    const config = require('./tailwind.config.js');
    console.log('Config loaded');
} catch (e) {
    console.error(e);
}
