
import { MongoEngine } from "../lib/mongo-engine";

async function test() {
    const engine = new MongoEngine();

    const tests = [
        { code: "db.users.find({ role: 'admin' })", desc: "Basic Find" },
        { code: "db.products.find({ price: { $gt: 100 } }).sort({ price: 1 })", desc: "Find with Operators and Sort" },
        { code: "db.orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])", desc: "Aggregation" }
    ];

    for (const t of tests) {
        console.log(`\n--- Running: ${t.desc} ---`);
        console.log(`Code: ${t.code}`);
        try {
            const res = await engine.execute(t.code);
            console.log("Result:", JSON.stringify(res, null, 2));
        } catch (e: any) {
            console.error("Error:", e.message);
        }
    }
}

test();
