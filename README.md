# KISS Orm for MySQL

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/Tehem/mysql-kiss-orm.svg?branch=master)](https://travis-ci.org/Tehem/mysql-kiss-orm)
[![Maintainability](https://api.codeclimate.com/v1/badges/9bfea0dab15584faf5eb/maintainability)](https://codeclimate.com/github/Tehem/mysql-kiss-orm/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/9bfea0dab15584faf5eb/test_coverage)](https://codeclimate.com/github/Tehem/mysql-kiss-orm/test_coverage)
## Introduction

Small ORM wrapper for [`node-mysql2`](https://github.com/sidorares/node-mysql2), 

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
await mysql.insertOne('users', user);
// INSERT INTO users (id, name, email) VALUES (123, 'John Doe', 'test@example.com');

await mysql.updateOne('users', { id: 123 }, { name: 'Jane Doe' });
// UPDATE users SET name='Jane Doe' WHERE id=123

await mysql.deleteOne('users', user);
// DELETE FROM users WHERE id=user.id ...

// Return all matching rows with limit, offset and sort
const users = await mysql.findMany('users', { type: 2 }, { offset: 10, limit: 10, sort: { name: 'ASC' } });
// users = [{ id: 123, name: 'Jane Doe', ... }, { ... } ]

// Return the first matching row
const user = await mysql.findOne('users', { id: 123 }, { projections: ['name'] });
// user = { name: 'Jane Doe' }

// RAW prepared queries
const [ rows ] = await mysql.query('SELECT id FROM users WHERE email=?', ['test@example.com']);
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
$ mysql -u root -e "CREATE DATABASE IF NOT EXISTS mysql_kiss_orm_test"
$ MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_DATABASE=mysql_kiss_orm_test MYSQL_USER=root MYSQL_PASSWORD= npm test
```
