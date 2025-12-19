import mingo from "mingo";
import { collections } from "@/data/collections";

// Setup Mingo to work like MongoDB
// We need to initialize operators if not using the default full build, 
// but 'mingo' main export usually includes standard operators.
// For safety/strictness, we can import specific operators if needed, 
// but for a playground, the default full bundle is best.

export class MongoEngine {
    private collections: Record<string, any[]>;

    constructor() {
        this.collections = collections;
    }

    /**
     * Parses the user code string and executes it against the mock database.
     * e.g. "db.users.find({ role: 'admin' })"
     */
    async execute(code: string): Promise<any> {
        const cleanCode = code.trim();

        // Simple parsing logic: 
        // 1. Identify collection: db.collectionName
        // 2. Identify method: .find(...) or .aggregate(...)
        // 3. Extract arguments.

        // We will use a safe Function evaluation to parse object arguments, 
        // but we need to mock the 'db' object.

        let result: any = null;

        const dbProxy = new Proxy({}, {
            get: (target, collectionName: string) => {
                if (!this.collections[collectionName]) {
                    throw new Error(`Collection '${collectionName}' does not exist.`);
                }

                return {
                    find: (query: any = {}, projection?: any) => {
                        // Mingo find
                        const cursor = mingo.find(this.collections[collectionName], query, projection);
                        return {
                            sort: (sortCriteria: any) => {
                                return cursor.sort(sortCriteria).all();
                            },
                            limit: (limit: number) => {
                                return cursor.limit(limit).all();
                            },
                            toArray: () => cursor.all(),
                            // If no chain, we treat the cursor as the result (we'll unwrap it later or immediately)
                            // But for this simple engine, let's return a "Chainable" object or just arrays.
                            // To make it easy: let's behave like the shell -> find returns a cursor, 
                            // but typically in these playgrounds we show the array.
                            // So let's auto-fetch all if the user doesn't chain. 
                            // BUT, how do we know if they chain?
                            // Current simple approach: Return an object that has result + chain methods.
                            __isCursor: true,
                            cursor: cursor
                        }
                    },
                    aggregate: (pipeline: any[]) => {
                        return mingo.aggregate(this.collections[collectionName], pipeline);
                    },
                    countDocuments: (query: any = {}) => {
                        return (mingo.find(this.collections[collectionName], query) as any).count();
                    }
                };
            }
        });

        // We'll wrap the execution in a function that returns the result
        // The user code is likely an expression "db.users.find(...)"
        // We need to "return" it if it's a single line, or capture the last statement.
        // Simplifying assumption for now: Code is a single expression.

        try {
            // Evaluate the code using eval to handle comments and multiple statements correctly.
            // We use a Function wrapper to provide 'db' in scope.
            // 'eval' returns the completion value of the last statement.
            const func = new Function('db', 'code', 'return eval(code)');
            const executionResult = func(dbProxy, cleanCode);

            // Unwrap if it's our custom cursor wrapper
            if (executionResult && executionResult.__isCursor) {
                result = executionResult.cursor.all();
            } else {
                result = executionResult;
            }

        } catch (err: any) {
            throw new Error(`Execution Error: ${err.message}`);
        }

        return result;
    }
}
