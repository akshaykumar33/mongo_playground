
const fs = require('fs');
const path = require('path');

const NUM_USERS = 1000;
const NUM_PRODUCTS = 1000;
const NUM_ORDERS = 5000;

// Helpers
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

const firstNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Liam", "Noah", "Oliver", "William", "Elijah", "James", "Benjamin", "Lucas", "Mason", "Ethan", "Olivia", "Emma", "Ava", "Charlotte", "Sophia", "Amelia", "Isabella", "Mia", "Evelyn", "Harper"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const roles = ["admin", "user", "manager", "moderator", "analyst"];
const tagsList = ["developer", "designer", "intern", "lead", "veteran", "management", "contractor", "remote", "full-time"];

const categories = ["Electronics", "Furniture", "Stationery", "Clothing", "Books", "Home & Garden", "Toys", "Sports", "Automotive", "Beauty"];
const productAdjectives = ["Pro", "Max", "Ultra", "Lite", "Standard", "Premium", "Budget", "Wireless", "Smart", "Ergonomic"];
const productNouns = ["Laptop", "Mouse", "Chair", "Monitor", "Notebook", "Headphones", "Keyboard", "Table", "Lamp", "Phone", "Watch", "Tablet", "Camera", "Speaker"];
const productTags = ["tech", "office", "home", "gaming", "outdoor", "kids", "luxury", "bargain", "wireless", "wired"];

// Generate Users
console.log("Generating Users...");
const users = [];
for (let i = 1; i <= NUM_USERS; i++) {
  const firstName = getRandom(firstNames);
  const lastName = getRandom(lastNames);
  users.push({
    _id: i,
    name: `${firstName} ${lastName}`,
    role: getRandom(roles),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
    age: getRandomInt(18, 70),
    points: getRandomInt(0, 5000),
    isActive: Math.random() > 0.2, // 80% active
    tags: [getRandom(tagsList), getRandom(tagsList)].filter((v, i, a) => a.indexOf(v) === i)
  });
}

// Generate Products
console.log("Generating Products...");
const products = [];
for (let i = 1; i <= NUM_PRODUCTS; i++) {
   products.push({
     _id: 100 + i,
     name: `${getRandom(productAdjectives)} ${getRandom(productNouns)}`,
     category: getRandom(categories),
     price: getRandomInt(10, 2000),
     stock: getRandomInt(0, 500),
     rating: Math.round((Math.random() * 4 + 1) * 10) / 10, // 1.0 to 5.0
     specs: {
        weight: `${getRandomInt(100, 3000)}g`,
        warranty: `${getRandomInt(1, 3)} years`
     },
     tags: [getRandom(productTags), getRandom(productTags)].filter((v, i, a) => a.indexOf(v) === i)
   });
}

// Generate Orders
console.log("Generating Orders...");
const orders = [];
for (let i = 1; i <= NUM_ORDERS; i++) {
    const user = getRandom(users);
    const numItems = getRandomInt(1, 5);
    const items = [];
    let total = 0;
    
    for(let j=0; j<numItems; j++) {
        const prod = getRandom(products);
        const qty = getRandomInt(1, 3);
        items.push({ productId: prod._id, quantity: qty, name: prod.name, price: prod.price });
        total += prod.price * qty;
    }

    orders.push({
        _id: 1000 + i,
        userId: user._id,
        items: items, // store expanded items for easier querying in playground if needed, or just IDs. kept IDs + snapshot in real apps.
        total: total,
        status: getRandom(["pending", "shipped", "completed", "cancelled", "returned"]),
        date: getRandomDate(new Date(2023, 0, 1), new Date())
    });
}

const fileContent = `
export const users = ${JSON.stringify(users, null, 2)};

export const products = ${JSON.stringify(products, null, 2)};

export const orders = ${JSON.stringify(orders, null, 2)};

export const collections: Record<string, any[]> = {
  users,
  products,
  orders,
};
`;

const outputPath = path.join(__dirname, '../data/collections.ts');
fs.writeFileSync(outputPath, fileContent);
console.log(`Generated ${NUM_USERS} users, ${NUM_PRODUCTS} products, ${NUM_ORDERS} orders to ${outputPath}`);
