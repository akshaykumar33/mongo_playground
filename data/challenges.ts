export type Challenge = {
    id: string
    title: string
    description: string
    level: "basic" | "intermediate" | "expert"
    defaultCode: string
    solution: string
    hints: string[]
    expectedOutput: any
}

export const challenges: Challenge[] = [
    // BASIC
    {
        id: "basic-1",
        title: "Find All Users",
        description: "Write a query to find all documents in the 'users' collection.",
        level: "basic",
        defaultCode: "db.users.find({})",
        solution: "db.users.find({})",
        hints: ["Use the find() method", "Pass an empty object {} to select all"],
        expectedOutput: [
            { _id: 1, name: "Alice", role: "admin", points: 1200 },
            { _id: 2, name: "Bob", role: "user", points: 800 },
            { _id: 3, name: "Charlie", role: "user", points: 950 }
        ]
    },
    {
        id: "basic-2",
        title: "Find by Role",
        description: "Find all users with the role 'admin'.",
        level: "basic",
        defaultCode: "db.users.find({ ... })",
        solution: "db.users.find({ role: 'admin' })",
        hints: ["Filter by the 'role' field"],
        expectedOutput: [
            { _id: 1, name: "Alice", role: "admin", points: 1200 }
        ]
    },

    // INTERMEDIATE
    {
        id: "inter-1",
        title: "Count Users by Role",
        description: "Use aggregation to count how many users there are for each role.",
        level: "intermediate",
        defaultCode: "db.users.aggregate([\n  { $group: { ... } }\n])",
        solution: "db.users.aggregate([ { $group: { _id: '$role', count: { $sum: 1 } } } ])",
        hints: ["Use $group stage", "Group by '$role'", "Use $sum: 1 to count"],
        expectedOutput: [
            { _id: "admin", count: 1 },
            { _id: "user", count: 2 }
        ]
    },
    {
        id: "inter-2",
        title: "High Scorers",
        description: "Find users with more than 900 points, sorted by points descending.",
        level: "intermediate",
        defaultCode: "db.users.find(...).sort(...)",
        solution: "db.users.find({ points: { $gt: 900 } }).sort({ points: -1 })",
        hints: ["Use $gt operator", "Sort with -1 for descending"],
        expectedOutput: [
            { _id: 1, name: "Alice", role: "admin", points: 1200 },
            { _id: 3, name: "Charlie", role: "user", points: 950 }
        ]
    },

    // EXPERT
    {
        id: "expert-1",
        title: "Average Points per Role",
        description: "Calculate the average points for each role, but only for roles with average > 800.",
        level: "expert",
        defaultCode: "db.users.aggregate([...])",
        solution: "db.users.aggregate([ { $group: { _id: '$role', avgPoints: { $avg: '$points' } } }, { $match: { avgPoints: { $gt: 800 } } } ])",
        hints: ["Group first", "Calculate $avg", "Then $match on the result"],
        expectedOutput: [
            { _id: "admin", avgPoints: 1200 },
            { _id: "user", avgPoints: 875 }
        ]
    }
]
