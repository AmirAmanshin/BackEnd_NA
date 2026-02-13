// ████ Import of packs ████
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open').default;
const logger = require('./middleware/logger');
const { ObjectId } = require('mongodb'); 
const { connectDB, getDb } = require('./db');
const session = require("express-session");
const bcrypt = require("bcrypt");



// ████ Port with env ████
const port = process.env.PORT || 3000

const ALLOWED_CLIENT_TYPES = new Set(["silver", "gold", "palladium"]);



// ████ Express ████
const app = express();


// ████ Middle ████
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ╬╬╬ Sessions ╬╬╬
app.set("trust proxy", 1);

// ╬╬╬ Cookies ╬╬╬
app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET || "dev_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: "auto",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 6
  }
}));
// ╬╬╬ Logger ╬╬╬
app.use(logger);
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static('public'));


// ████ HTML getters ████
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});


app.post('/contact.html', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).send('Fill all fields');
    }

    const contactData = { name, email, message, date: new Date() };
    const filePath = path.join(__dirname, 'contact_data.json');

    fs.writeFile(filePath, JSON.stringify(contactData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
        }
        res.download(filePath, 'contact_data.json');
    });
});


// ████ Authentication ████
function requireAuth(req, res, next) {
    if (!req.session || !req.session.employeeId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
// ╬╬╬ Admin checking ╬╬╬
async function requireAdmin(req, res, next) {
    try {
        const db = getDb();

        const employee = await db.collection("employees").findOne(
        { _id: new ObjectId(req.session.employeeId) },
        { projection: { position: 1 } }
        );

        if (!employee) return res.status(401).json({ error: "Unauthorized" });

        const pos = String(employee.position || "").trim().toLowerCase();
        if (pos !== "admin") return res.status(403).json({ error: "Admin only" });

        next();
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

app.post("/login", async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const db = getDb();
        const employee = await db.collection("employees").findOne({ login });

        // generic errors only
        if (!employee || !employee.password_hash) {
        return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, employee.password_hash);
        if (!ok) {
        return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.employeeId = employee._id.toString();
        res.json({ message: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("sid");
        res.json({ message: "ok" });
    });
});

app.get("/me", async (req, res) => {
    if (!req.session?.employeeId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const db = getDb();
        const employee = await db.collection("employees").findOne(
        { _id: new ObjectId(req.session.employeeId) },
        { projection: { password_hash: 0 } }
        );

        if (!employee) return res.status(401).json({ error: "Unauthorized" });

        res.json({
        message: "ok",
        data: {
            id: employee._id.toString(),
            name: employee.name,
            position: employee.position,
            login: employee.login,
            createdAt: employee.createdAt
        }
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.put("/me", requireAuth, async (req, res) => {
    const { name, position, login, new_password } = req.body;

    const update = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (typeof position === "string" && position.trim()) update.position = position.trim();
    if (typeof login === "string" && login.trim()) update.login = login.trim();

    try {
        const db = getDb();

        if (new_password && String(new_password).trim().length) {
        update.password_hash = await bcrypt.hash(String(new_password), 10);
        }

        if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "Nothing to update" });
        }

        if (update.login) {
        const exists = await db.collection("employees").findOne({
            login: update.login,
            _id: { $ne: new ObjectId(req.session.employeeId) }
        });
        if (exists) return res.status(409).json({ error: "Login already exists" });
        }

        await db.collection("employees").updateOne(
        { _id: new ObjectId(req.session.employeeId) },
        { $set: update }
        );

        res.json({ message: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});









// ████ CRUD API ████
app.get('/api/info', (req, res) => {
    res.json({
        name: "Bank site",
        description: "Banking System with MongoDB Integration",
        author: "Nuraly and Amir. A"
    });
});


// ╬╬╬ READ ╬╬╬
app.get('/api/data', requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.collection('data').find({}).toArray();

        const formattedData = rows.map(item => ({
        id: item._id.toString(),
        full_name: item.full_name,
        card_number: item.card_number,
        expiration_date: item.expiration_date,
        cvc: item.cvc,
        client_type: item.client_type
        }));

        res.json({ message: "success", data: formattedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ╬╬╬ CREATE ╬╬╬
app.post('/api/data', requireAuth, async (req, res) => {
    const { full_name, card_number, expiration_date, cvc, client_type } = req.body;

    if (!full_name || !card_number || !expiration_date || !cvc || !client_type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ALLOWED_CLIENT_TYPES.has(String(client_type).toLowerCase())) {
        return res.status(400).json({ error: "Invalid client_type" });
    }

    try {
        const db = getDb();

        const doc = {
        full_name,
        card_number,
        expiration_date,
        cvc,
        client_type: String(client_type).toLowerCase()
        };

        const result = await db.collection('data').insertOne(doc);

        res.status(201).json({
        message: "success",
        data: { id: result.insertedId.toString(), ...doc }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ╬╬╬ UPDATE ╬╬╬
app.put('/api/data/:id', requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const update = { ...req.body };
        delete update._id;
        delete update.id;

        // если обновляют client_type — проверяем
        if (update.client_type !== undefined) {
        const ct = String(update.client_type).toLowerCase();
        if (!ALLOWED_CLIENT_TYPES.has(ct)) {
            return res.status(400).json({ error: "Invalid client_type" });
        }
        update.client_type = ct;
        }

        const result = await db.collection('data').updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
        );

        if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Record not found" });
        }

        res.json({ message: "success", modified: result.modifiedCount });
    } catch (err) {
        res.status(400).json({ error: "Update failed (check ID format)" });
    }
});


// ╬╬╬ DELETE ╬╬╬
app.delete('/api/data/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const result = await db.collection('data').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Record not found" });
        }

        res.json({ message: "deleted", id });
    } catch (err) {
        res.status(400).json({ error: "Delete failed (check ID format)" });
    }
});


// ╬╬╬ SEARCH ╬╬╬
app.get('/search', requireAuth, async (req, res) => {
    const q = (req.query.q ?? "").trim();

    if (!q) {
        return res.status(400).send("Bad Request");
    }

    try {
        const db = getDb();

        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        const rows = await db.collection("data").find({
        $or: [
            { full_name: regex },
            { card_number: regex },
            { expiration_date: regex },
            { cvc: regex },
            { client_type: regex }
        ]
        }).toArray();

        const results = rows.map(item => ({
        id: item._id.toString(),
        full_name: item.full_name,
        card_number: item.card_number,
        expiration_date: item.expiration_date,
        cvc: item.cvc,
        client_type: item.client_type
        }));

        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Search</title>
        </head>
        <body>
            <h1>Search results</h1>
            <p>Query: <strong>${q}</strong></p>

            ${results.length === 0
            ? "<p>No results found</p>"
            : `<ul>
                ${results.map(r => `
                    <li>
                    ${r.full_name} — ${r.card_number} — ${r.client_type ?? "—"}
                    </li>
                `).join("")}
                </ul>`
            }

            <a href="/">Back</a>
        </body>
        </html>
        `);

    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});



// ████ Error calls ████
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});
// 201 Created — в результате успешного выполнения запроса был создан новый ресурс.
// Код 200 OK — это статус ответа HTTP, что веб-сервер успешно обработал запрос и предоставил пользователю запрошенный контент.
// Код ответа сервера 500 Internal Server Error указывает на то, что сервер столкнулся с неожиданной ошибкой, которая помешала ему выполнить запрос.
// Ошибка 400 bad request переводится как «плохой запрос». Она возникает тогда, когда браузер пользователя отправляет некорректный запрос серверу, на котором находится сайт.







connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});