'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Querying database', () => {
  let mysqlConnection;
  const sandbox = sinon.createSandbox();
  const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  before(async () => {
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
  });

  beforeEach(async () => {
    await mysqlConnection.execute('DROP TABLE IF EXISTS `tests`');
    await mysqlConnection.execute(
      'CREATE TABLE `tests` (`id` INT(11) NOT NULL, `name` VARCHAR(100) NOT NULL, `type` INT(1) NOT NULL)',
    );
    await mysqlConnection.execute(
      "INSERT INTO `tests` VALUES(1, 'test 1', 1), (2, 'test 2', 3), (3, 'test 3', 3)",
    );
  });

  afterEach(async () => {
    sandbox.restore();
    await mysqlConnection.query('DROP TABLE IF EXISTS `tests`');
  });

  after(async () => {
    await mysqlConnection.end();
  });

  describe('#query', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

    it('throws an error on invalid query', async () => {
      let error;
      let rows;
      try {
        [rows] = await mysqlConector.query('SELECT FALSE FROM', []);
      } catch (err) {
        error = err;
      }
      expect(rows).to.equal(undefined);
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.match(/^You have an error in your SQL syntax/);
    });

    it('throws an error on invalid placeholders', async () => {
      let error;
      let rows;
      try {
        [rows] = await mysqlConector.query('SELECT ? AS test FROM DUAL', null);
      } catch (err) {
        error = err;
      }
      expect(rows).to.equal(undefined);
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal(
        'Incorrect arguments to mysqld_stmt_execute',
      );
    });

    it('performs a simple query without placeholders', async () => {
      const [rows] = await mysqlConector.query(
        "SELECT 'test' AS TEST FROM DUAL",
      );
      expect(rows).to.deep.equal([{ TEST: 'test' }]);
    });

    it('performs a query against database with placeholders', async () => {
      const [rows] = await mysqlConector.query(
        "SELECT 'test' AS TEST, ? AS TEST2 FROM DUAL",
        ['test2'],
      );
      expect(rows).to.deep.equal([{ TEST: 'test', TEST2: 'test2' }]);
    });
  });

  describe('#getLastQuery', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

    it('returns last SQL with placeholders #1', async () => {
      await mysqlConector.query('SELECT ? AS test1, ? AS test2 FROM DUAL', [
        'joe',
        'mocha',
      ]);
      const last = mysqlConector.getLastQuery();
      expect(last).to.equal(
        'SELECT ? AS test1, ? AS test2 FROM DUAL [joe, mocha]',
      );
    });
  });
});
