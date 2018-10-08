# KISS Orm for MySQL

## Introduction

If you just want to manipulate Javascript object and don't want to bother with building SQL to query your MySQL database.

This library provide a simple abstraction capable of handling most common queries you will need (SELECT, INSERT, UPDATE, DELETE) 
through a fluid (sort of) API.

This library use the async/await syntax.

## Example

```javascript
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
  };

const mysql = new MysqlConnector(mysqlConfig);
await mysql.connect();

const user = { id: 123, name: 'John Doe', email: 'test@example.com' };
await mysql.insert('users', user);
// INSERT INTO users (id, name, email) VALUES (123, 'John Doe', 'test@example.com');

await mysql.updateOne('users', { id: 123 }, { name: 'Jane Doe' });
// UPDATE users SET name='Jane Doe' WHERE id=123

await mysql.deleteOne('users', user);
// DELETE FROM users WHERE id=user.id ...

const user = await mysql.findOne({ id: 123 }, ['name']);
// user = { id: 123, name: 'Jane Doe' }

// RAW prepared queries
const rows = await mysql.query('SELECT id FROM users WHERE email=?', ['test@example.com']);
// rows = [{ id: 42, id: 965, id: 394 }]

await mysql.disconnect();
```

## Usage

This library is a wrapper for the mysql2/promise library.
