const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const db = require("./database");

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not set in environment variables.");
    process.exit(1);
}

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =========================
   FRONTEND
========================= */

const frontendDir = path.join(
    __dirname,
    "../frontend"
);

app.use(
    express.static(frontendDir)
);


/* =========================
   UPLOADS
========================= */

const uploadDir =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadDir
                );

            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const ext =
                    path.extname(
                        file.originalname
                    );

                const filename =
                    Date.now() +
                    "-" +
                    Math.round(
                        Math.random() * 1E9
                    ) +
                    ext;

                cb(
                    null,
                    filename
                );

            }

    });


const upload =
    multer({

        storage: storage,

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const allowed = [

                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif"

                ];


                if (
                    allowed.includes(
                        file.mimetype
                    )
                ) {

                    cb(
                        null,
                        true
                    );

                }

                else {

                    cb(
                        new Error(
                            "فرمت تصویر مجاز نیست."
                        )
                    );

                }

            }

    });


app.use(
    "/uploads",
    express.static(uploadDir)
);


/* =========================
   HOME
========================= */

app.get(
    "/api",
    (req, res) => {

        res.json({

            message:
                "BEHDASHT KALA Backend is working 🚀"

        });

    }
);


/* =========================
   AUTHENTICATION
========================= */

function authenticateSeller(
    req,
    res,
    next
) {

    try {

        const header =
            req.headers.authorization;


        if (
            !header ||
            !header.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                message:
                    "دسترسی غیرمجاز است."

            });

        }


        const token =
            header.split(" ")[1];


        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );


        req.sellerId =
            decoded.sellerId;


        next();

    }

    catch (error) {

        return res.status(401).json({

            message:
                "توکن نامعتبر یا منقضی شده است."

        });

    }

}


/* =========================
   REGISTER
========================= */

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {

                first_name,
                last_name,
                phone,
                store_name,
                store_type,
                province,
                city,
                address,
                postal_code,
                username,
                password

            } = req.body;


            if (
                !first_name ||
                !last_name ||
                !phone ||
                !store_name ||
                !store_type ||
                !province ||
                !city ||
                !address ||
                !postal_code ||
                !username ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "لطفاً تمام اطلاعات را وارد کنید."

                });

            }


            const existing =
                db.prepare(`
                    SELECT id
                    FROM sellers
                    WHERE username = ?
                    OR phone = ?
                `).get(
                    username,
                    phone
                );


            if (existing) {

                return res.status(400).json({

                    message:
                        "نام کاربری یا شماره تماس قبلاً ثبت شده است."

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const result =
                db.prepare(`
                    INSERT INTO sellers
                    (
                        first_name,
                        last_name,
                        phone,
                        store_name,
                        store_type,
                        province,
                        city,
                        address,
                        postal_code,
                        username,
                        password
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `).run(

                    first_name,
                    last_name,
                    phone,
                    store_name,
                    store_type,
                    province,
                    city,
                    address,
                    postal_code,
                    username,
                    hashedPassword

                );


            res.status(201).json({

                message:
                    "ثبت نام با موفقیت انجام شد.",

                sellerId:
                    result.lastInsertRowid

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در ثبت نام."

            });

        }

    }
);


/* =========================
   LOGIN
========================= */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "نام کاربری و رمز عبور را وارد کنید."

                });

            }


            const seller =
                db.prepare(`
                    SELECT *
                    FROM sellers
                    WHERE username = ?
                `).get(
                    username
                );


            if (!seller) {

                return res.status(401).json({

                    message:
                        "نام کاربری یا رمز عبور اشتباه است."

                });

            }


            const valid =
                await bcrypt.compare(
                    password,
                    seller.password
                );


            if (!valid) {

                return res.status(401).json({

                    message:
                        "نام کاربری یا رمز عبور اشتباه است."

                });

            }


            const token =
                jwt.sign(

                    {
                        sellerId:
                            seller.id
                    },

                    JWT_SECRET,

                    {
                        expiresIn:
                            "7d"
                    }

                );


            res.json({

                message:
                    "ورود موفق بود.",

                token,

                seller: {

                    id:
                        seller.id,

                    first_name:
                        seller.first_name,

                    last_name:
                        seller.last_name,

                    phone:
                        seller.phone,

                    store_name:
                        seller.store_name,

                    store_type:
                        seller.store_type,

                    province:
                        seller.province,

                    city:
                        seller.city,

                    address:
                        seller.address,

                    postal_code:
                        seller.postal_code,

                    username:
                        seller.username

                }

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در ورود."

            });

        }

    }
);


/* =========================
   SELLER PROFILE
========================= */

app.get(
    "/api/profile",
    authenticateSeller,
    (req, res) => {

        const seller =
            db.prepare(`
                SELECT
                    id,
                    first_name,
                    last_name,
                    phone,
                    store_name,
                    store_type,
                    province,
                    city,
                    address,
                    postal_code,
                    username,
                    created_at
                FROM sellers
                WHERE id = ?
            `).get(
                req.sellerId
            );


        if (!seller) {

            return res.status(404).json({

                message:
                    "فروشنده پیدا نشد."

            });

        }


        res.json(seller);

    }
);


/* =========================
   PRODUCTS - GET ALL
========================= */

app.get(
    "/api/products",
    authenticateSeller,
    (req, res) => {

        try {

            const products =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE seller_id = ?
                    ORDER BY id DESC
                `).all(
                    req.sellerId
                );


            res.json(products);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در دریافت محصولات."

            });

        }

    }
);


/* =========================
   PRODUCT - GET ONE
========================= */

app.get(
    "/api/products/:id",
    authenticateSeller,
    (req, res) => {

        try {

            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                    AND seller_id = ?
                `).get(

                    Number(req.params.id),

                    req.sellerId

                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            res.json(product);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در دریافت محصول."

            });

        }

    }
);


/* =========================
   PRODUCT - CREATE
========================= */

app.post(
    "/api/products",
    authenticateSeller,
    upload.single("image"),
    (req, res) => {

        try {

            const {

                name,
                category,
                purchase_price,
                sale_price,
                stock,
                production_date,
                expiration_date,
                barcode,
                description,
                min_stock,
                status

            } = req.body;


            if (
                !name ||
                !expiration_date
            ) {

                return res.status(400).json({

                    message:
                        "نام محصول و تاریخ انقضا الزامی است."

                });

            }


            const image =
                req.file
                    ? `/uploads/${req.file.filename}`
                    : null;


            const result =
                db.prepare(`
                    INSERT INTO products
                    (
                        seller_id,
                        name,
                        category,
                        purchase_price,
                        sale_price,
                        stock,
                        production_date,
                        expiration_date,
                        barcode,
                        description,
                        min_stock,
                        status,
                        image
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `).run(

                    req.sellerId,

                    name,

                    category || "",

                    Number(
                        purchase_price || 0
                    ),

                    Number(
                        sale_price || 0
                    ),

                    Number(
                        stock || 0
                    ),

                    production_date || "",

                    expiration_date,

                    barcode || "",

                    description || "",

                    Number(
                        min_stock || 0
                    ),

                    status || "فعال",

                    image

                );


            res.status(201).json({

                message:
                    "محصول با موفقیت ثبت شد.",

                id:
                    result.lastInsertRowid,

                image

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در ثبت محصول."

            });

        }

    }
);


/* =========================
   PRODUCT - UPDATE
========================= */

app.put(
    "/api/products/:id",
    authenticateSeller,
    upload.single("image"),
    (req, res) => {

        try {

            const productId =
                Number(req.params.id);


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                    AND seller_id = ?
                `).get(

                    productId,

                    req.sellerId

                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            const {

                name,
                category,
                purchase_price,
                sale_price,
                stock,
                production_date,
                expiration_date,
                barcode,
                description,
                min_stock,
                status,
                removeImage

            } = req.body;


            let image =
                product.image;


            if (req.file) {

                if (product.image) {

                    const oldFile =
                        path.join(
                            __dirname,
                            product.image.replace(
                                "/uploads/",
                                "uploads/"
                            )
                        );


                    if (fs.existsSync(oldFile)) {

                        fs.unlinkSync(oldFile);

                    }

                }


                image =
                    `/uploads/${req.file.filename}`;

            }


            if (
                removeImage === "true" &&
                !req.file
            ) {

                if (product.image) {

                    const oldFile =
                        path.join(
                            __dirname,
                            product.image.replace(
                                "/uploads/",
                                "uploads/"
                            )
                        );


                    if (fs.existsSync(oldFile)) {

                        fs.unlinkSync(oldFile);

                    }

                }


                image = null;

            }


            db.prepare(`
                UPDATE products

                SET

                    name = ?,
                    category = ?,
                    purchase_price = ?,
                    sale_price = ?,
                    stock = ?,
                    production_date = ?,
                    expiration_date = ?,
                    barcode = ?,
                    description = ?,
                    min_stock = ?,
                    status = ?,
                    image = ?

                WHERE id = ?

                AND seller_id = ?
            `).run(

                name,

                category || "",

                Number(
                    purchase_price || 0
                ),

                Number(
                    sale_price || 0
                ),

                Number(
                    stock || 0
                ),

                production_date || "",

                expiration_date,

                barcode || "",

                description || "",

                Number(
                    min_stock || 0
                ),

                status || "فعال",

                image,

                productId,

                req.sellerId

            );


            res.json({

                message:
                    "محصول با موفقیت ویرایش شد."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در ویرایش محصول."

            });

        }

    }
);


/* =========================
   PRODUCT - STOCK PATCH
========================= */

app.patch(
    "/api/products/:id/stock",
    authenticateSeller,
    (req, res) => {

        try {

            const productId =
                Number(req.params.id);

            const stock =
                Number(req.body.stock);


            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {

                return res.status(400).json({

                    message:
                        "موجودی نامعتبر است."

                });

            }


            const result =
                db.prepare(`
                    UPDATE products
                    SET stock = ?
                    WHERE id = ?
                    AND seller_id = ?
                `).run(

                    stock,

                    productId,

                    req.sellerId

                );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            res.json({

                message:
                    "موجودی تغییر کرد.",

                stock

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در تغییر موجودی."

            });

        }

    }
);


/* =========================
   INVENTORY - ADD / REMOVE
========================= */

app.post(
    "/api/products/:id/inventory",
    authenticateSeller,
    (req, res) => {

        try {

            const productId =
                Number(req.params.id);


            const type =
                String(
                    req.body.type || ""
                ).trim();


            const quantity =
                Number(
                    req.body.quantity
                );


            const reason =
                String(
                    req.body.reason || ""
                ).trim();


            if (
                type !== "in" &&
                type !== "out"
            ) {

                return res.status(400).json({

                    message:
                        "نوع عملیات نامعتبر است."

                });

            }


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                return res.status(400).json({

                    message:
                        "تعداد باید عدد صحیح بیشتر از صفر باشد."

                });

            }


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                    AND seller_id = ?
                `).get(

                    productId,

                    req.sellerId

                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            const previousStock =
                Number(
                    product.stock || 0
                );


            let newStock;


            if (type === "in") {

                newStock =
                    previousStock +
                    quantity;

            }

            else {

                newStock =
                    previousStock -
                    quantity;

            }


            if (newStock < 0) {

                return res.status(400).json({

                    message:
                        "موجودی کافی نیست."

                });

            }


            const transaction =
                db.transaction(() => {

                    db.prepare(`
                        UPDATE products
                        SET stock = ?
                        WHERE id = ?
                        AND seller_id = ?
                    `).run(

                        newStock,

                        productId,

                        req.sellerId

                    );


                    db.prepare(`
                        INSERT INTO inventory_history
                        (
                            seller_id,
                            product_id,
                            type,
                            quantity,
                            previous_stock,
                            new_stock,
                            reason
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `).run(

                        req.sellerId,

                        productId,

                        type,

                        quantity,

                        previousStock,

                        newStock,

                        reason || null

                    );

                });


            transaction();


            res.json({

                message:
                    type === "in"
                        ? "ورود کالا با موفقیت ثبت شد."
                        : "خروج کالا با موفقیت ثبت شد.",

                productId,

                previousStock,

                quantity,

                newStock

            });

        }

        catch (error) {

            console.error(
                "Inventory error:",
                error
            );

            res.status(500).json({

                message:
                    "خطا در ثبت عملیات انبار."

            });

        }

    }
);


/* =========================
   INVENTORY HISTORY - PRODUCT
========================= */

app.get(
    "/api/products/:id/inventory-history",
    authenticateSeller,
    (req, res) => {

        try {

            const productId =
                Number(req.params.id);


            const product =
                db.prepare(`
                    SELECT id
                    FROM products
                    WHERE id = ?
                    AND seller_id = ?
                `).get(

                    productId,

                    req.sellerId

                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            const history =
                db.prepare(`
                    SELECT
                        id,
                        product_id,
                        type,
                        quantity,
                        previous_stock,
                        new_stock,
                        reason,
                        created_at

                    FROM inventory_history

                    WHERE product_id = ?

                    AND seller_id = ?

                    ORDER BY id DESC
                `).all(

                    productId,

                    req.sellerId

                );


            res.json(history);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در دریافت تاریخچه."

            });

        }

    }
);


/* =========================
   INVENTORY HISTORY - ALL
========================= */

app.get(
    "/api/inventory-history",
    authenticateSeller,
    (req, res) => {

        try {

            const history =
                db.prepare(`
                    SELECT

                        ih.id,

                        ih.product_id,

                        ih.type,

                        ih.quantity,

                        ih.previous_stock,

                        ih.new_stock,

                        ih.reason,

                        ih.created_at,

                        p.name AS product_name,

                        p.barcode

                    FROM inventory_history ih

                    INNER JOIN products p

                        ON p.id =
                           ih.product_id

                    WHERE
                        ih.seller_id = ?

                    ORDER BY
                        ih.id DESC
                `).all(

                    req.sellerId

                );


            res.json(history);

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در دریافت تاریخچه انبار."

            });

        }

    }
);


/* =========================
   PRODUCT DELETE
========================= */

app.delete(
    "/api/products/:id",
    authenticateSeller,
    (req, res) => {

        try {

            const productId =
                Number(req.params.id);


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                    AND seller_id = ?
                `).get(

                    productId,

                    req.sellerId

                );


            if (!product) {

                return res.status(404).json({

                    message:
                        "محصول پیدا نشد."

                });

            }


            if (product.image) {

                const imagePath =
                    path.join(
                        __dirname,
                        product.image.replace(
                            "/uploads/",
                            "uploads/"
                        )
                    );


                if (fs.existsSync(imagePath)) {

                    fs.unlinkSync(imagePath);

                }

            }


            db.prepare(`
                DELETE FROM products
                WHERE id = ?
                AND seller_id = ?
            `).run(

                productId,

                req.sellerId

            );


            res.json({

                message:
                    "محصول حذف شد."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "خطا در حذف محصول."

            });

        }

    }
);


/* =========================
   MULTER ERROR
========================= */

app.use(
    (error, req, res, next) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({

                message:
                    "خطا در آپلود تصویر."

            });

        }


        if (error) {

            return res.status(400).json({

                message:
                    error.message ||
                    "خطای نامشخص."

            });

        }


        next();

    }
);


/* =========================
   SERVER
========================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);