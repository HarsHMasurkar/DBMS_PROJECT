const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Aakansha19@',
  database: 'restaurant'
});

async function addUser() {
  try {
    const password = 'harsh123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name: 'Harsh',
      email: 'harsh@gmail.com',
      password: hashedPassword,
      role: 'admin'
    };

    connection.query(
      'UPDATE user SET password = ?, role = ? WHERE email = ?',
      [user.password, user.role, user.email],
      function(err, results) {
        if (err) {
          console.error('Error updating user:', err);
          process.exit(1);
        }
        console.log('User updated successfully');
        console.log('You can now login with:');
        console.log('Email:', user.email);
        console.log('Password:', password);
        process.exit(0);
      }
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUser(); 