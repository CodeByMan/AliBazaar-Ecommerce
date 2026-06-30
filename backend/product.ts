import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from './src/category/category.entity';
import { Product } from './src/product/product.entity';
import { ProductImage } from './src/product/product-image.entity';

config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ecommerce',
  entities: [Product, Category, ProductImage],
  synchronize: false,
});

const products = [
  [
    'Nike Air Max',
    'Comfortable running shoes',
    5999,
    50,
    'nike-air-max.jpg',
    'Footwear',
  ],
  [
    'Adidas T-Shirt',
    'Cotton sports t-shirt',
    1299,
    100,
    'adidas-tshirt.jpg',
    'Clothing',
  ],
  [
    'Apple iPhone 15',
    'Latest Apple iPhone 15',
    99999,
    30,
    'iphone15.jpg',
    'Electronics',
  ],
  [
    'Samsung Galaxy S23',
    'Samsung flagship phone',
    84999,
    40,
    'galaxy-s23.jpg',
    'Electronics',
  ],
  [
    'Sony WH-1000XM5',
    'Noise-cancelling headphones',
    24999,
    25,
    'sony-headphones.jpg',
    'Electronics',
  ],
  [
    "Levi's Jeans",
    'Slim fit denim jeans',
    3499,
    60,
    'levis-jeans.jpg',
    'Clothing',
  ],
  [
    'Puma Sports Shoes',
    'Running and training shoes',
    3999,
    45,
    'puma-shoes.jpg',
    'Footwear',
  ],
  [
    'Canon EOS 90D',
    'DSLR Camera for photography',
    59999,
    15,
    'canon-eos.jpg',
    'Electronics',
  ],
  [
    'Dell Inspiron Laptop',
    '15-inch Windows laptop',
    45999,
    20,
    'dell-inspiron.jpg',
    'Electronics',
  ],
  [
    'Reebok Hoodie',
    'Warm and cozy hoodie',
    1999,
    80,
    'reebok-hoodie.jpg',
    'Clothing',
  ],
  [
    'Ray-Ban Sunglasses',
    'Stylish sunglasses',
    7999,
    35,
    'rayban.jpg',
    'Accessories',
  ],
  [
    'Fossil Watch',
    'Leather strap analog watch',
    9999,
    25,
    'fossil-watch.jpg',
    'Accessories',
  ],
  [
    'HP DeskJet Printer',
    'All-in-one printer',
    4999,
    15,
    'hp-printer.jpg',
    'Electronics',
  ],
  [
    'Nike Socks Pack',
    'Comfortable cotton socks',
    499,
    100,
    'nike-socks.jpg',
    'Footwear',
  ],
  [
    'Adidas Cap',
    'Sports cap for sunny days',
    799,
    50,
    'adidas-cap.jpg',
    'Clothing',
  ],
  [
    'Logitech Mouse',
    'Wireless ergonomic mouse',
    1499,
    40,
    'logitech-mouse.jpg',
    'Electronics',
  ],
  [
    'Amazon Echo Dot',
    'Smart speaker with Alexa',
    3499,
    30,
    'echo-dot.jpg',
    'Electronics',
  ],
  [
    'KitchenAid Mixer',
    'Stand mixer for baking',
    12999,
    10,
    'kitchenaid.jpg',
    'Home Appliances',
  ],
  [
    'Nike Running Shorts',
    'Lightweight shorts for running',
    1299,
    70,
    'nike-shorts.jpg',
    'Clothing',
  ],
  [
    'Sony PlayStation 5',
    'Next-gen gaming console',
    49999,
    12,
    'ps5.jpg',
    'Electronics',
  ],
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedProducts() {
  await dataSource.initialize();
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);
  let added = 0;

  for (const [
    name,
    description,
    price,
    stock,
    image,
    categoryName,
  ] of products) {
    const existing = await productRepo.findOne({ where: { name } });
    if (existing) continue;
    let category = await categoryRepo.findOne({
      where: { name: categoryName },
    });
    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({
          name: categoryName,
          slug: slugify(categoryName),
          description: null,
          image: null,
          isActive: true,
        }),
      );
    }
    await productRepo.save(
      productRepo.create({
        name,
        description,
        price,
        stock,
        image,
        category: category.name,
        categoryEntity: category,
      }),
    );
    added += 1;
  }

  console.log(`${added} product(s) added. Existing products were skipped.`);
  await dataSource.destroy();
}

void seedProducts().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exitCode = 1;
});
