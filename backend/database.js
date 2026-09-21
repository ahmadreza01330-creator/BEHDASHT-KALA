const Database = require("better-sqlite3");

const db = new Database("behdasht-kala.db");

// جدول فروشندگان
db.exec(`
CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    store_type TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// جدول کالاها
db.exec(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    purchase_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    production_date TEXT,
    expiration_date TEXT NOT NULL,
    barcode TEXT,
    description TEXT,
    min_stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'فعال',
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id)
    REFERENCES sellers(id)
);
`);

console.log("Database connected successfully ✅");

module.exports = db;