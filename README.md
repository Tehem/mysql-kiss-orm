# KISS Orm for MySQL

## Introduction

Small ORM wrapper for [`node-mysql2-promise`](https://github.com/namshi/node-mysql2-promise), 

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

const users = await mysql.findMany({ type: 2 });
// users = [{ id: 123, name: 'Jane Doe', ... }, { ... } ]

const user = await mysql.findOne({ id: 123 }, ['name']);
// user = { id: 123, name: 'Jane Doe' }

// RAW prepared queries
const rows = await mysql.query('SELECT id FROM users WHERE email=?', ['test@example.com']);
// rows = [{ id: 42, id: 965, id: 394 }]

await mysql.disconnect();
```

## Usage

TODO

## Running tests

Set the environment variables `MYSQL_DATABASE`, `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_USER` and `MYSQL_PASSWORD`. Then run `npm test`.

For example, if you have an installation of mysql running on localhost:3306
and no password set for the `root` user, run:

```sh
$ mysql -u root -e "CREATE DATABASE IF NOT EXISTS kiss_orm_test"
$ MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_DATABASE=kiss_orm_test MYSQL_USER=root MYSQL_PASSWORD= npm test
```
