// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 3000;
const JWT_SECRET = 'cafe-management-secret-key'; // In production, use environment variable

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aakansha19@',
    database: 'restaurant'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted token:', token);
    
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Authentication token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        console.log('Token verified successfully for user:', user);
        req.user = user;
        next();
    });
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            'INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role],
            (err, results) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ 
                    message: 'User registered successfully',
                    userId: results.insertId
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // First check if user exists
        const [users] = await db.promise().query('SELECT * FROM user WHERE email = ?', [email]);
        console.log('User query result:', users);

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        // Compare password
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', passwordMatch);

        if (!passwordMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        
        // Send response
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

// Get all menu items
app.get('/api/menu', authenticateToken, (req, res) => {
    console.log('Fetching menu items');
    db.query('SELECT * FROM menu_items ORDER BY category, name', (err, results) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('Menu items fetched successfully:', results.length, 'items');
        res.json(results);
    });
});

// Update menu item
app.put('/api/menu/:id', authenticateToken, (req, res) => {
    const { name, price, category, description, image_url, availability } = req.body;
    const id = req.params.id;
    console.log('Updating menu item:', id, req.body);
    
    db.query(
        'UPDATE menu_items SET name = ?, price = ?, category = ?, description = ?, image_url = ?, availability = ? WHERE id = ?',
        [name, price, category, description, image_url, availability, id],
        (err, results) => {
            if (err) {
                console.error('Error updating menu item:', err);
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                console.log('Menu item not found:', id);
                return res.status(404).json({ error: 'Menu item not found' });
            }
            console.log('Menu item updated successfully:', id);
            res.json({ message: 'Menu item updated successfully' });
        }
    );
});

// Add new menu item
app.post('/api/menu', authenticateToken, (req, res) => {
    const { name, price, category, description, image_url } = req.body;
    console.log('Adding new menu item:', { name, price, category });
    
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    
    db.query(
        'INSERT INTO menu_items (name, price, category, description, image_url, availability) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, category, description, image_url, true],
        (err, results) => {
            if (err) {
                console.error('Error adding menu item:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Menu item added successfully:', results.insertId);
            res.status(201).json({ 
                message: 'Menu item added successfully',
                id: results.insertId
            });
        }
    );
});

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    console.log('Deleting menu item:', id);
    
    db.query('DELETE FROM menu_items WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error deleting menu item:', err);
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            console.log('Menu item not found:', id);
            return res.status(404).json({ error: 'Menu item not found' });
        }
        console.log('Menu item deleted successfully:', id);
        res.json({ message: 'Menu item deleted successfully' });
    });
});

// Table Management Endpoints
app.get('/api/tables', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM tables ORDER BY floor, table_number';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tables:', err);
            return res.status(500).json({ error: 'Error fetching tables' });
        }
        res.json(results);
    });
});

app.get('/api/tables/:id', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM tables WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching table:', err);
            return res.status(500).json({ error: 'Error fetching table' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }
        res.json(results[0]);
    });
});

app.put('/api/tables/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    const query = 'UPDATE tables SET status = ? WHERE id = ?';
    db.query(query, [status, req.params.id], (err, results) => {
        if (err) {
            console.error('Error updating table status:', err);
            return res.status(500).json({ error: 'Error updating table status' });
        }
        res.json({ message: 'Table status updated successfully' });
    });
});

// Create a reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
    const { table_id, customer_name, phone_number, reservation_time } = req.body;
    
    if (!table_id || !customer_name || !phone_number || !reservation_time) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if table is available
    db.query('SELECT status FROM tables WHERE id = ?', [table_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        if (results[0].status !== 'available') {
            return res.status(400).json({ error: 'Table is not available' });
        }
        
        // Check if there's already a reservation for this table at this time
        db.query(
            'SELECT * FROM reservations WHERE table_id = ? AND reservation_time = ? AND status = ?',
            [table_id, reservation_time, 'upcoming'],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (results.length > 0) {
                    return res.status(400).json({ error: 'Table is already reserved for this time' });
                }
                
                // Create the reservation
                db.query(
                    'INSERT INTO reservations (table_id, customer_name, phone_number, reservation_time) VALUES (?, ?, ?, ?)',
                    [table_id, customer_name, phone_number, reservation_time],
                    (err, results) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        
                        // Update table status
                        db.query(
                            'UPDATE tables SET status = ? WHERE id = ?',
                            ['reserved', table_id],
                            (err) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                
                                res.status(201).json({ 
                                    message: 'Reservation created successfully',
                                    reservationId: results.insertId
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// Get all reservations
app.get('/api/reservations', authenticateToken, (req, res) => {
    db.query(`
        SELECT r.*, t.table_number, t.floor 
        FROM reservations r
        JOIN tables t ON r.table_id = t.id
        ORDER BY r.reservation_time DESC
    `, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Update reservation status
app.put('/api/reservations/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.query(
        'UPDATE reservations SET status = ? WHERE id = ?',
        [status, id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation not found' });
            }
            
            // If reservation is completed, update table status to available
            if (status === 'completed') {
                db.query('SELECT table_id FROM reservations WHERE id = ?', [id], (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    if (results.length > 0) {
                        db.query(
                            'UPDATE tables SET status = ? WHERE id = ?',
                            ['available', results[0].table_id],
                            (err) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.json({ message: 'Reservation status updated successfully' });
                            }
                        );
                    } else {
                        res.json({ message: 'Reservation status updated successfully' });
                    }
                });
            } else {
                res.json({ message: 'Reservation status updated successfully' });
            }
        }
    );
});

// Create a new order
app.post('/api/orders', authenticateToken, (req, res) => {
    const { table_id, items } = req.body;
    
    if (!table_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Table ID and items are required' });
    }
    
    // Calculate total price
    let totalPrice = 0;
    const orderItems = [];
    
    // First, verify all items exist and get their prices
    const itemPromises = items.map(item => {
        return new Promise((resolve, reject) => {
            db.query('SELECT id, price, availability FROM menu_items WHERE id = ?', [item.id], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (results.length === 0) {
                    reject(new Error(`Menu item with ID ${item.id} not found`));
                    return;
                }
                
                const menuItem = results[0];
                if (!menuItem.availability) {
                    reject(new Error(`Menu item ${menuItem.name} is not available`));
                    return;
                }
                
                totalPrice += menuItem.price * item.quantity;
                orderItems.push({
                    id: menuItem.id,
                    price: menuItem.price,
                    quantity: item.quantity
                });
                
                resolve();
            });
        });
    });
    
    Promise.all(itemPromises)
        .then(() => {
            // Start transaction
            db.beginTransaction(err => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Create the order
                db.query(
                    'INSERT INTO orders (table_id, total_price) VALUES (?, ?)',
                    [table_id, totalPrice],
                    (err, results) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        
                        const orderId = results.insertId;
                        
                        // Insert order items into bills table
                        const billValues = orderItems.map(item => [orderId, item.id, item.quantity, item.price]);
                        db.query(
                            'INSERT INTO bills (order_id, menu_item_id, quantity, price) VALUES ?',
                            [billValues],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: err.message });
                                    });
                                }
                                
                                // Update table status to occupied
                                db.query(
                                    'UPDATE tables SET status = ? WHERE id = ?',
                                    ['occupied', table_id],
                                    (err) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({ error: err.message });
                                            });
                                        }
                                        
                                        db.commit(err => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ error: err.message });
                                                });
                                            }
                                            
                                            res.status(201).json({ 
                                                message: 'Order created successfully',
                                                orderId: orderId,
                                                totalPrice: totalPrice
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        })
        .catch(error => {
            res.status(400).json({ error: error.message });
        });
});

// Get all orders
app.get('/api/orders', authenticateToken, (req, res) => {
    db.query(`
        SELECT o.*, t.table_number, t.floor
        FROM orders o
        JOIN tables t ON o.table_id = t.id
        ORDER BY o.created_at DESC
    `, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get order details
app.get('/api/orders/:id', authenticateToken, (req, res) => {
    const orderId = req.params.id;
    
    db.query(`
        SELECT b.*, m.name, m.category
        FROM bills b
        JOIN menu_items m ON b.menu_item_id = m.id
        WHERE b.order_id = ?
    `, [orderId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(results);
    });
});

// Update order status
app.put('/api/orders/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            
            // If order is completed, update table status to available
            if (status === 'completed') {
                db.query('SELECT table_id FROM orders WHERE id = ?', [id], (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    if (results.length > 0) {
                        db.query(
                            'UPDATE tables SET status = ? WHERE id = ?',
                            ['available', results[0].table_id],
                            (err) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.json({ message: 'Order status updated successfully' });
                            }
                        );
                    } else {
                        res.json({ message: 'Order status updated successfully' });
                    }
                });
            } else {
                res.json({ message: 'Order status updated successfully' });
            }
        }
    );
});

// Get dashboard data
app.get('/api/dashboard', authenticateToken, (req, res) => {
    // Get today's sales
    const today = new Date().toISOString().split('T')[0];
    
    db.query(`
        SELECT COUNT(*) as pendingOrders, SUM(total_price) as todaySales
        FROM orders
        WHERE DATE(created_at) = ? AND status = 'pending'
    `, [today], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const pendingOrders = results[0].pendingOrders || 0;
        
        // Get total sales for today
        db.query(`
            SELECT SUM(total_price) as totalSales
            FROM orders
            WHERE DATE(created_at) = ? AND status = 'completed'
        `, [today], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const todaySales = results[0].totalSales || 0;
            
            res.json({
                pendingOrders,
                todaySales
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});