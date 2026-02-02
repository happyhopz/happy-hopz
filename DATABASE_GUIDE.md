# Database Management Guide

## Option 1: Using Prisma Studio (Visual Database Editor)

### Start Prisma Studio:
```bash
cd server
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables (Product, User, Order, Cart, etc.)
- Edit any record directly
- Add new records
- Delete records
- Search and filter

## Option 2: Using SQLite Command Line

### Open database:
```bash
cd server
sqlite3 prisma/dev.db
```

### Useful commands:
```sql
-- View all products
SELECT * FROM Product;

-- Update product price
UPDATE Product SET price = 2999 WHERE id = 'product-id-here';

-- Update product stock
UPDATE Product SET stock = 100 WHERE name = 'Product Name';

-- Add new product
INSERT INTO Product (id, name, description, price, category, ageGroup, stock, sizes, colors, images, status)
VALUES ('new-id', 'New Shoe', 'Description', 2999, 'Sneakers', '3-6 years', 50, '["S","M","L"]', '["Red","Blue"]', '["image-url"]', 'ACTIVE');

-- Delete product
DELETE FROM Product WHERE id = 'product-id-here';

-- Exit
.exit
```

## Option 3: Using VS Code SQLite Extension

1. Install "SQLite" extension in VS Code
2. Open `server/prisma/dev.db`
3. Right-click → "Open Database"
4. Browse and edit tables visually

## Database Location
- **File:** `server/prisma/dev.db`
- **Backup:** Copy this file to backup your data
- **Reset:** Delete this file and run `npx prisma db push` to recreate

## Quick Product Update Examples

### Change all prices to INR (multiply by 83):
```sql
UPDATE Product SET price = price * 83, discountPrice = discountPrice * 83;
```

### Mark low stock items:
```sql
SELECT name, stock FROM Product WHERE stock < 10;
```

### Update specific product:
```sql
UPDATE Product 
SET price = 2499, 
    discountPrice = 1999, 
    stock = 75 
WHERE name = 'Cloud Hoppers';
```
