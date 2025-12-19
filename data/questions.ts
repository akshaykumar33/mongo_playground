
export type Question = {
    id: string
    title: string
    description: string
    category: "Basics" | "Filtering" | "Sorting & Limiting" | "Projections" | "Aggregation" | "Array Operators"
    difficulty: "Beginner" | "Intermediate" | "Advanced"
    collection: "users" | "products" | "orders"
    solution: string
    defaultCode?: string
    hints: string[]
}

const questions: Question[] = [
    // --- BASICS (USERS) ---
    {
        id: "basic-1",
        title: "Find All Users",
        description: "Retrieve all documents from the 'users' collection.",
        category: "Basics",
        difficulty: "Beginner",
        collection: "users",
        solution: "db.users.find({})",
        hints: ["Use find({}) with an empty object"]
    },
    {
        id: "basic-2",
        title: "Find Admin Users",
        description: "Find all users where the role is 'admin'.",
        category: "Basics",
        difficulty: "Beginner",
        collection: "users",
        solution: "db.users.find({ role: 'admin' })",
        hints: ["Filter by { role: 'admin' }"]
    },
    {
        id: "basic-3",
        title: "Find Active Users",
        description: "Find all users who are currently active.",
        category: "Basics",
        difficulty: "Beginner",
        collection: "users",
        solution: "db.users.find({ isActive: true })",
        hints: ["Check the boolean field 'isActive'"]
    },
    {
        id: "basic-4",
        title: "Find by Age",
        description: "Find users who are exactly 28 years old.",
        category: "Basics",
        difficulty: "Beginner",
        collection: "users",
        solution: "db.users.find({ age: 28 })",
        hints: []
    },

    // --- FILTERING (PRODUCTS) ---
    {
        id: "filter-1",
        title: "Cheap Products",
        description: "Find products with a price less than 100.",
        category: "Filtering",
        difficulty: "Beginner",
        collection: "products",
        solution: "db.products.find({ price: { $lt: 100 } })",
        hints: ["Use the $lt operator"]
    },
    {
        id: "filter-2",
        title: "Electronics Category",
        description: "Find all products in the 'Electronics' category.",
        category: "Filtering",
        difficulty: "Beginner",
        collection: "products",
        solution: "db.products.find({ category: 'Electronics' })",
        hints: []
    },
    {
        id: "filter-3",
        title: "Price Range",
        description: "Find products with price between 50 and 200 (inclusive).",
        category: "Filtering",
        difficulty: "Intermediate",
        collection: "products",
        solution: "db.products.find({ price: { $gte: 50, $lte: 200 } })",
        hints: ["Use $gte and $lte"]
    },
    {
        id: "filter-4",
        title: "Specific Tech",
        description: "Find products that have the tag 'tech'.",
        category: "Filtering",
        difficulty: "Intermediate",
        collection: "products",
        solution: "db.products.find({ tags: 'tech' })",
        hints: ["MongoDB matches if the array contains the value"]
    },

    // --- SORTING & LIMITING (ORDERS) ---
    {
        id: "sort-1",
        title: "Recent Orders",
        description: "Find all orders, sorted by date in descending order (newest first).",
        category: "Sorting & Limiting",
        difficulty: "Beginner",
        collection: "orders",
        solution: "db.orders.find({}).sort({ date: -1 })",
        hints: ["Use sort({ date: -1 })"]
    },
    {
        id: "sort-2",
        title: "Highest Value Orders",
        description: "Find the top 3 orders with the highest 'total' value.",
        category: "Sorting & Limiting",
        difficulty: "Intermediate",
        collection: "orders",
        solution: "db.orders.find({}).sort({ total: -1 }).limit(3)",
        hints: ["Sort descending", "Chain .limit(3)"]
    },

    // --- PROJECTIONS (USERS) ---
    {
        id: "proj-1",
        title: "User Names Only",
        description: "Find all users but only return their 'name' field (and _id).",
        category: "Projections",
        difficulty: "Beginner",
        collection: "users",
        solution: "db.users.find({}, { name: 1 })",
        hints: ["Use the second argument of find()"]
    },
    {
        id: "proj-2",
        title: "Hide Sensitive Data",
        description: "Find all users but exclude 'email' and 'points'.",
        category: "Projections",
        difficulty: "Intermediate",
        collection: "users",
        solution: "db.users.find({}, { email: 0, points: 0 })",
        hints: ["Set fields to 0 to exclude"]
    },

    // --- AGGREGATION (ORDERS) ---
    {
        id: "agg-1",
        title: "Total Revenue",
        description: "Calculate the total revenue (sum of 'total') from all orders.",
        category: "Aggregation",
        difficulty: "Intermediate",
        collection: "orders",
        solution: "db.orders.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$total' } } }])",
        hints: ["Use $group with _id: null", "Use $sum"]
    },
    {
        id: "agg-2",
        title: "Orders by Status",
        description: "Count how many orders exist for each status.",
        category: "Aggregation",
        difficulty: "Intermediate",
        collection: "orders",
        solution: "db.orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])",
        hints: ["Group by '$status'"]
    },
    {
        id: "agg-3",
        title: "Average Order Value",
        description: "Calculate the average order value.",
        category: "Aggregation",
        difficulty: "Intermediate",
        collection: "orders",
        solution: "db.orders.aggregate([{ $group: { _id: null, avgTotal: { $avg: '$total' } } }])",
        hints: ["Use $avg"]
    },

    // --- ARRAY OPERATORS (PRODUCTS) ---
    {
        id: "arr-1",
        title: "Size of Tags",
        description: "Find products that have exactly 2 tags.",
        category: "Array Operators",
        difficulty: "Advanced",
        collection: "products",
        solution: "db.products.find({ tags: { $size: 2 } })",
        hints: ["Use $size operator"]
    },
    {
        id: "arr-2",
        title: "Match All Tags",
        description: "Find products that have BOTH 'tech' and 'work' tags.",
        category: "Array Operators",
        difficulty: "Advanced",
        collection: "products",
        solution: "db.products.find({ tags: { $all: ['tech', 'work'] } })",
        hints: ["Use $all operator"]
    },

    // --- ADVANCED AGGREGATION & LOOKUPS ---
    {
        id: "adv-1",
        title: "Lookup User Orders",
        description: "Join 'users' with 'orders' to see all orders placed by 'Alice Smith'.",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "users",
        solution: "db.users.aggregate([ { $match: { name: 'Alice Smith' } }, { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'userOrders' } } ])",
        hints: ["Use $lookup", "Match the user first"]
    },
    {
        id: "adv-2",
        title: "High Value Customers",
        description: "Find users who have spent more than $2000 in total across all orders.",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.aggregate([ { $group: { _id: '$userId', totalSpent: { $sum: '$total' } } }, { $match: { totalSpent: { $gt: 2000 } } } ])",
        hints: ["Group by userId", "Sum the total", "Match the result"]
    },
    {
        id: "adv-3",
        title: "Unwind & Count Items",
        description: "Calculate the total quantity of ALL items sold (unwind the items array in orders).",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.aggregate([ { $unwind: '$items' }, { $group: { _id: null, totalQty: { $sum: '$items.quantity' } } } ])",
        hints: ["Use $unwind on 'items'", "Sum 'items.quantity'"]
    },
    {
        id: "adv-4",
        title: "Most Popular Category",
        description: "Find the most popular product category by total quantity sold. (Requires traversing Orders -> Items -> Products, which is hard with mock data structure, so simplify: Find most popular Product Name from order items).",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.aggregate([ { $unwind: '$items' }, { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } }, { $sort: { count: -1 } }, { $limit: 1 } ])",
        hints: ["Unwind items", "Group by items.name", "Sort descending", "Limit 1"]
    },
    {
        id: "adv-5",
        title: "Active Users Stats",
        description: "Calculate the average points of 'active' vs 'inactive' users.",
        category: "Aggregation",
        difficulty: "Intermediate",
        collection: "users",
        solution: "db.users.aggregate([ { $group: { _id: '$isActive', avgPoints: { $avg: '$points' } } } ])",
        hints: ["Group by isActive"]
    },
    {
        id: "adv-6",
        title: "Price Bucket Distribution",
        description: "Categorize products into price buckets: 0-100, 100-500, 500-1000, >1000.",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "products",
        solution: "db.products.aggregate([ { $bucket: { groupBy: '$price', boundaries: [0, 100, 500, 1000, 5000], default: 'Other', output: { count: { $sum: 1 }, products: { $push: '$name' } } } } ])",
        hints: ["Use $bucket stage"]
    },
    {
        id: "adv-7",
        title: "Complex Filter with Regex",
        description: "Find users whose name starts with 'A' and ends with 'n' (case-insensitive).",
        category: "Filtering",
        difficulty: "Advanced",
        collection: "users",
        solution: "db.users.find({ name: { $regex: '^A.*n$', $options: 'i' } })",
        hints: ["Use $regex", "^ start, $ end"]
    },
    {
        id: "adv-8",
        title: "ElemMatch on Specs",
        description: "Find orders that contain an item with quantity > 2 AND price > 100.",
        category: "Array Operators",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.find({ items: { $elemMatch: { quantity: { $gt: 2 }, price: { $gt: 100 } } } })",
        hints: ["Use $elemMatch on items array"]
    },
    {
        id: "adv-9",
        title: "Yearly Sales Report",
        description: "Group orders by Year and Status, calculating total revenue for each group.",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.aggregate([ { $addFields: { year: { $year: { $toDate: '$date' } } } }, { $group: { _id: { year: '$year', status: '$status' }, total: { $sum: '$total' } } }, { $sort: { '_id.year': -1 } } ])",
        hints: ["Convert date string if needed (or assume it works)", "Group by compound _id"]
    },
    {
        id: "adv-10",
        title: "Top Spenders per Region",
        description: "Actually just Top 5 Spenders with their details.",
        category: "Aggregation",
        difficulty: "Advanced",
        collection: "orders",
        solution: "db.orders.aggregate([ { $group: { _id: '$userId', totalSpent: { $sum: '$total' } } }, { $sort: { totalSpent: -1 } }, { $limit: 5 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } } ])",
        hints: ["Group", "Sort", "Limit", "Lookup"]
    }
];

export const getQuestions = () => questions;
export const getQuestionById = (id: string) => questions.find(q => q.id === id);
