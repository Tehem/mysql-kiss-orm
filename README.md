# KISS Orm for MySQL

[![npm](https://img.shields.io/npm/v/mysql-kiss-orm.svg)](https://www.npmjs.com/package/mysql-kiss-orm)
[![License](https://img.shields.io/github/license/Tehem/mysql-kiss-orm.svg)](LICENSE)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/Tehem/mysql-kiss-orm.svg?branch=master)](https://travis-ci.org/Tehem/mysql-kiss-orm)
[![Maintainability](https://api.codeclimate.com/v1/badges/9bfea0dab15584faf5eb/maintainability)](https://codeclimate.com/github/Tehem/mysql-kiss-orm/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/9bfea0dab15584faf5eb/test_coverage)](https://codeclimate.com/github/Tehem/mysql-kiss-orm/test_coverage)

## Table of Contents

- [Install](#install)
- [Introduction](#introduction)
- [Examples](#examples)
- [Running Tests](#running-tests)

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 8.12 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install mysql-kiss-orm
```
## Introduction

Small ORM wrapper for [`node-mysql2`](https://github.com/sidorares/node-mysql2), 

If you just want to manipulate Javascript object and don't want to bother with building SQL to query your MySQL database.

This library provide a simple abstraction capable of handling most common queries you will need (SELECT, INSERT, UPDATE, DELETE) 
through a fluid (sort of) API.

This library use the async/await syntax.

## Examples

```javascript
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
  };

const mysql = new MysqlConnector(mysqlConfig);
await mysql.connect();

const user = { name: 'John Doe', email: 'test@example.com' };
const results = await mysql.insertOne('users', user);
// INSERT INTO users (name, email) VALUES ('John Doe', 'test@example.com');
const insertId = results.insertId; // id = 12345


await mysql.insertMany('users', [{ name: 'Jake Coffee' }, { name: 'John Latte' }]);
// INSERT INTO users (name) VALUES ('Jake Coffee'), ('John Latte');

await mysql.updateOne('users', { id: 123 }, { name: 'Jane Doe' });
// UPDATE users SET name='Jane Doe' WHERE id=123

await mysql.updateMany('users', { type: 2 }, { country: 'France' });
// UPDATE users SET country='France' WHERE type=2
const countUpdated = results.affectedRows;

await mysql.deleteOne('users', user);
// DELETE FROM users WHERE id=user.id ...

// Return all matching rows with limit, offset and sort
const users = await mysql.findMany('users', { type: 2 }, { offset: 10, limit: 10, sort: { name: 'ASC' } });
// users = [{ id: 123, name: 'Jane Doe', ... }, { ... } ]

// Return the first matching row
const user = await mysql.findOne('users', { id: 123 }, { projections: ['name'] });
// user = { name: 'Jane Doe' }

// Row count (COUNT *)
const count = await mysql.count('users', { type: 5 });
// count = 122

// RAW prepared queries
const [ rows ] = await mysql.query('SELECT id FROM users WHERE email=?', ['test@example.com']);
// rows = [{ id: 42, id: 965, id: 394 }]

await mysql.disconnect();
```

## Running tests

Set the environment variables `MYSQL_DATABASE`, `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_USER` and `MYSQL_PASSWORD`. Then run `npm test`.

For example, if you have an installation of mysql running on localhost:3306
and no password set for the `root` user, run:

```sh
$ mysql -u root -e "CREATE DATABASE IF NOT EXISTS mysql_kiss_orm_test"
$ MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_DATABASE=mysql_kiss_orm_test MYSQL_USER=root MYSQL_PASSWORD= npm test
```
