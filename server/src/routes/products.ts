import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all products with filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const { category, ageGroup, search, minPrice, maxPrice, status } = req.query;

        const where: any = {};

        if (category) where.category = category;
        if (ageGroup) where.ageGroup = ageGroup;
        if (status) where.status = status;
        else where.status = 'ACTIVE'; // Default to active products

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { tags: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Parse JSON strings
        const formattedProducts = products.map(p => ({
            ...p,
            sizes: JSON.parse(p.sizes),
            colors: JSON.parse(p.colors),
            images: JSON.parse(p.images),
            tags: p.tags ? JSON.parse(p.tags) : []
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id as string }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            ...product,
            sizes: JSON.parse(product.sizes),
            colors: JSON.parse(product.colors),
            images: JSON.parse(product.images),
            tags: product.tags ? JSON.parse(product.tags) : []
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (Admin only)
const createProductSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number().positive(),
    discountPrice: z.number().positive().optional(),
    category: z.string(),
    ageGroup: z.string(),
    sizes: z.array(z.string()),
    colors: z.array(z.string()),
    stock: z.number().int().nonnegative(),
    images: z.array(z.string()),
    tags: z.array(z.string()).optional()
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createProductSchema.parse(req.body);

        const product = await prisma.product.create({
            data: {
                ...data,
                sizes: JSON.stringify(data.sizes),
                colors: JSON.stringify(data.colors),
                images: JSON.stringify(data.images),
                tags: data.tags ? JSON.stringify(data.tags) : '[]'
            }
        });

        res.status(201).json({
            ...product,
            sizes: JSON.parse(product.sizes),
            colors: JSON.parse(product.colors),
            images: JSON.parse(product.images),
            tags: product.tags ? JSON.parse(product.tags) : []
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createProductSchema.partial().parse(req.body);

        const updateData: any = { ...data };
        if (data.sizes) updateData.sizes = JSON.stringify(data.sizes);
        if (data.colors) updateData.colors = JSON.stringify(data.colors);
        if (data.images) updateData.images = JSON.stringify(data.images);
        if (data.tags) updateData.tags = JSON.stringify(data.tags);

        const product = await prisma.product.update({
            where: { id: req.params.id as string },
            data: updateData
        });

        res.json({
            ...product,
            sizes: JSON.parse(product.sizes),
            colors: JSON.parse(product.colors),
            images: JSON.parse(product.images),
            tags: product.tags ? JSON.parse(product.tags) : []
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id as string }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;
