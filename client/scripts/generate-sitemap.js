import fs from 'fs';
import axios from 'axios';

const BASE_URL = 'https://happyhopz.com';
const API_URL = 'https://api.happyhopz.com/api';

async function generateSitemap() {
    try {
        console.log('Generating sitemap...');

        // Static routes
        const staticRoutes = [
            '',
            '/products',
            '/about',
            '/contact',
            '/faq',
            '/shipping',
            '/returns',
            '/size-guide',
            '/privacy',
            '/terms'
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static routes
        staticRoutes.forEach(route => {
            sitemap += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // Add dynamic product routes
        console.log('Fetching products for sitemap...');
        const response = await axios.get(`${API_URL}/products`);
        const products = response.data.data || response.data;

        products.forEach(product => {
            sitemap += `
  <url>
    <loc>${BASE_URL}/products/${product.id}</loc>
    <lastmod>${new Date(product.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
        });

        sitemap += '\n</urlset>';

        fs.writeFileSync('./public/sitemap.xml', sitemap);
        console.log('Sitemap generated successfully at ./public/sitemap.xml');
    } catch (error) {
        console.error('Error generating sitemap:', error.message);
    }
}

generateSitemap();
