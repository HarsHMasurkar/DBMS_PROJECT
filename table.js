const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aakansha19@',
    database: 'restaurant'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

// Routes

// 1. Table Reservation
app.post('/tables/:tableId/reserve', (req, res) => {
    const tableId = req.params.tableId;
    
    

    const sql = 'UPDATE tables SET is_reserved = TRUE WHERE table_id = ?';
    db.query(sql, [tableId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Table reserved successfully' });
    });
});

// 2. Place Order
app.post('/tables/:tableId/orders', (req, res) => {
    const tableId = req.params.tableId;

    if (!req.body) {
        return res.status(400).json({ error: 'Request body is missing' });
    }

    const { itemId, quantity } = req.body;

    if (!itemId || !quantity) {
        return res.status(400).json({ error: 'itemId or quantity is missing' });
    }

    // Check if tableId exists
    const checkTableSql = 'SELECT table_id FROM tables WHERE table_id = ?';
    db.query(checkTableSql, [tableId], (tableCheckErr, tableCheckResults) => {
        if (tableCheckErr) {
            return res.status(500).json({ error: tableCheckErr.message });
        }

        if (tableCheckResults.length === 0) {
            return res.status(400).json({ error: 'Table ID does not exist' });
        }

        // Table exists, proceed with order insertion
        const sql = 'INSERT INTO orders (table_id, item_id, quantity) VALUES (?, ?, ?)';
        db.query(sql, [tableId, itemId, quantity], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Order placed successfully' });
        });
    });
});

// 3. Generate Bill
app.get('/tables/:tableId/bill', (req, res) => {
    const tableId = req.params.tableId;
    const sql = `
        SELECT mi.item_name, mi.price, o.quantity
        FROM orders o
        JOIN menu_items mi ON o.item_id = mi.item_id
        WHERE o.table_id = ?
    `;
    db.query(sql, [tableId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        let totalAmount = 0;
        results.forEach(item => {
            totalAmount += item.price * item.quantity;
        });

        const billSql = 'INSERT INTO bills (table_id, total_amount) VALUES (?, ?)';
        db.query(billSql, [tableId, totalAmount], (billErr, billResult) => {
            if (billErr) {
                return res.status(500).json({ error: billErr.message });
            }
            res.json({ items: results, totalAmount: totalAmount });
        });
    });
});

// 4. Menu Items
app.get('/menu', (req, res) => {
    const sql = 'SELECT * FROM menu_items';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 5. Table List
app.get('/tables', (req, res) => {
    const sql = 'SELECT * FROM tables';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});