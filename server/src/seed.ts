import { PrismaClient } from '@prisma/client';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';



async function main() {
    console.log('🌱 Seeding database...');
    if (process.env.DATABASE_URL) {
        console.log(`🔗 Connecting to: ${new URL(process.env.DATABASE_URL).hostname}`);
        console.log(`📡 Database Name: ${new URL(process.env.DATABASE_URL).pathname}`);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('gudduhopz@22', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'happyhopz308@gmail.com' },
        update: {
            password: await bcrypt.hash('gudduhopz@22', 10),
            role: 'ADMIN'
        },
        create: {
            email: 'happyhopz308@gmail.com',
            password: adminPassword,
            name: 'Happy Hopz Admin',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create test user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'user@test.com' },
        update: {},
        create: {
            email: 'user@test.com',
            password: userPassword,
            name: 'Test User',
            phone: '+91 9876543210',
            role: 'USER'
        }
    });
    console.log('✅ Test user created:', user.email);

    // Create sample products - Boys
    const boysProducts = [
        {
            name: 'Boys Rainbow Runners',
            description: 'Colorful sneakers for boys perfect for active kids. Features breathable mesh and cushioned sole for all-day comfort.',
            price: 2499,
            discountPrice: 1999,
            category: 'Sneakers',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Blue', 'Green', 'Red']),
            stock: 50,
            images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Boys Sporty Sandals',
            description: 'Comfortable summer sandals for boys with adjustable straps. Perfect for outdoor play.',
            price: 1299,
            discountPrice: 999,
            category: 'Sandals',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Blue', 'Black', 'Grey']),
            stock: 40,
            images: JSON.stringify(['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Boys School Classic',
            description: 'Classic school shoes for boys with durable construction. Polishable leather look for uniform days.',
            price: 1999,
            category: 'School',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Black', 'Brown']),
            stock: 60,
            images: JSON.stringify(['https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Boys Party Loafers',
            description: 'Stylish loafers for boys perfect for parties and special occasions. Comfortable fit with sleek design.',
            price: 2299,
            discountPrice: 1899,
            category: 'Party Wear',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Black', 'Navy', 'Brown']),
            stock: 30,
            images: JSON.stringify(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Boys Turbo Sports',
            description: 'High-performance sports shoes for boys. Enhanced grip, lightweight, perfect for football and running.',
            price: 2799,
            discountPrice: 2399,
            category: 'Sports Shoes',
            ageGroup: '9-12 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Red', 'Blue', 'Black']),
            stock: 45,
            images: JSON.stringify(['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Boys Action Sneakers',
            description: 'New arrival sneakers for active boys. Lightweight with memory foam insole.',
            price: 2199,
            category: 'Sneakers',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Grey', 'Orange', 'Green']),
            stock: 40,
            images: JSON.stringify(['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400']),
            status: 'ACTIVE'
        },
    ];

    // Create sample products - Girls
    const girlsProducts = [
        {
            name: 'Girls Sparkle Sneakers',
            description: 'Magical sneakers for girls with sparkle details. Lightweight and flexible for growing feet.',
            price: 2299,
            discountPrice: 1899,
            category: 'Sneakers',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Pink', 'Purple', 'Rose Gold']),
            stock: 45,
            images: JSON.stringify(['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Girls Flower Sandals',
            description: 'Beautiful flower-decorated sandals for girls. Comfortable and stylish for summer.',
            price: 1499,
            discountPrice: 1199,
            category: 'Sandals',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Pink', 'White', 'Lavender']),
            stock: 50,
            images: JSON.stringify(['https://images.unsplash.com/photo-1562183241-b937e95585b6?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Girls School Mary Janes',
            description: 'Classic Mary Jane school shoes for girls. Buckle closure with comfortable fit.',
            price: 1899,
            category: 'School',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Black', 'Brown']),
            stock: 55,
            images: JSON.stringify(['https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Girls Princess Party Heels',
            description: 'Low-heel party shoes for girls with rhinestone details. Perfect for birthdays and weddings.',
            price: 2599,
            discountPrice: 2199,
            category: 'Party Wear',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Silver', 'Gold', 'Pink']),
            stock: 30,
            images: JSON.stringify(['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Girls Twinkle Ballet Flats',
            description: 'Soft ballet flats for little dancers. Satin finish with elegant bow detail.',
            price: 1699,
            discountPrice: 1399,
            category: 'Ballet',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Pink', 'White', 'Lavender']),
            stock: 40,
            images: JSON.stringify(['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Girls Dance Ballet',
            description: 'Professional ballet shoes for girls. Split sole design for flexibility.',
            price: 1999,
            category: 'Ballet',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Pink', 'Nude', 'Black']),
            stock: 35,
            images: JSON.stringify(['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400']),
            status: 'ACTIVE'
        },
    ];

    // Create sample products - New Arrivals
    const newArrivals = [
        {
            name: 'New Neon Runners',
            description: 'Fresh new style with neon accents. Just dropped for the new season!',
            price: 2699,
            discountPrice: 2299,
            category: 'Sneakers',
            ageGroup: '6-9 years',
            sizes: JSON.stringify(['M', 'L', 'XL']),
            colors: JSON.stringify(['Neon Green', 'Neon Pink', 'Neon Orange']),
            stock: 60,
            images: JSON.stringify(['https://images.unsplash.com/photo-1539185441755-769473a23570?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'New Summer Beach Sandals',
            description: 'Latest sandal design for summer. Quick-dry with fun patterns.',
            price: 1399,
            category: 'Sandals',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Aqua', 'Coral', 'Yellow']),
            stock: 45,
            images: JSON.stringify(['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400']),
            status: 'ACTIVE'
        },
    ];

    // Create sample products - Trending
    const trendingProducts = [
        {
            name: 'Unicorn Magic Sneakers',
            description: 'Trending unicorn-themed sneakers. Most loved by parents and kids alike!',
            price: 2499,
            discountPrice: 1999,
            category: 'Sneakers',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Rainbow', 'Purple', 'Pink']),
            stock: 100,
            images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400']),
            status: 'ACTIVE'
        },
        {
            name: 'Dinosaur Adventure Boots',
            description: 'Best seller boots with dinosaur prints. Rugged and ready for exploration!',
            price: 2999,
            discountPrice: 2499,
            category: 'Boots',
            ageGroup: '3-6 years',
            sizes: JSON.stringify(['S', 'M', 'L']),
            colors: JSON.stringify(['Green', 'Brown', 'Navy']),
            stock: 80,
            images: JSON.stringify(['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400']),
            status: 'ACTIVE'
        },
    ];

    const allProducts = [...boysProducts, ...girlsProducts, ...newArrivals, ...trendingProducts];

    for (const product of allProducts) {
        await prisma.product.create({ data: product });
    }
    console.log(`✅ Created ${allProducts.length} products`);

    // Create sample address for test user
    const sampleAddress = await prisma.address.create({
        data: {
            userId: user.id,
            name: 'Test User',
            phone: '+91 9876543210',
            line1: '123 Happy Street',
            line2: 'Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        }
    });
    console.log('✅ Created sample address');

    // Create sample orders
    const products = await prisma.product.findMany({ take: 3 });
    const orderStatuses = ['PLACED', 'PACKED', 'SHIPPED', 'DELIVERED'];
    const paymentStatuses = ['PENDING', 'COMPLETED'];

    for (let i = 0; i < 5; i++) {
        await prisma.order.create({
            data: {
                userId: user.id,
                total: products.reduce((sum, p) => sum + p.price, 0),
                status: orderStatuses[i % 4],
                paymentStatus: paymentStatuses[i % 2],
                addressId: sampleAddress.id,
                items: {
                    create: products.map(p => ({
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                        quantity: 1,
                        size: 'M',
                        color: 'Blue'
                    }))
                }
            }
        });
    }
    console.log('✅ Created 5 sample orders');

    console.log('🎉 Seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: happyhopz308@gmail.com / gudduhopz@22');
    console.log('User: user@test.com / user123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
