'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Inserting rows', () => {
  let mysqlConnection;
  const sandbox = sinon.createSandbox();
  const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };
  const mysqlConector = new MysqlConnector(mysqlConfig);

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
    await mysqlConector.connect();
  });

  afterEach(async () => {
    sandbox.restore();
    await mysqlConnection.query('DROP TABLE IF EXISTS `tests`');
    await mysqlConector.disconnect();
  });

  after(async () => {
    await mysqlConnection.end();
  });

  describe('#insertMany', () => {
    it('throws an error if rows is invalid', async () => {
      let error;
      try {
        await mysqlConector.insertMany('tests', null);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal(
        'Invalid parameter for rows, must be an array of objects',
      );
    });

    it('throws an error if rows fields mismatch', async () => {
      let error;
      try {
        await mysqlConector.insertMany('tests', [
          { id: 1, type: 1, name: 'John Doe' },
          { id: 2, name: 'Joe Mocha' },
        ]);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal(
        'Inconsistent object keys among row objects',
      );
    });

    it('inserts a set of rows with only one row in the table', async () => {
      const { affectedRows } = await mysqlConector.insertMany('tests', [
        { type: 1, id: 3, name: 'Jake Cappuccino' },
      ]);

      expect(affectedRows).to.equal(1);

      const rows = await mysqlConector.findMany(
        'tests',
        {},
        { sort: { id: 'ASC' } },
      );
      expect(rows).to.deep.equal([{ id: 3, name: 'Jake Cappuccino', type: 1 }]);
    });

    it('inserts a set of rows in the table', async () => {
      const { affectedRows } = await mysqlConector.insertMany('tests', [
        { id: 1, type: 1, name: 'John Doe' },
        { id: 2, name: 'Joe Mocha', type: 2 },
        { type: 1, id: 3, name: 'Jake Cappuccino' },
      ]);

      expect(affectedRows).to.equal(3);

      const rows = await mysqlConector.findMany(
        'tests',
        {},
        { sort: { id: 'ASC' } },
      );
      expect(rows).to.deep.equal([
        { id: 1, name: 'John Doe', type: 1 },
        { id: 2, name: 'Joe Mocha', type: 2 },
        { id: 3, name: 'Jake Cappuccino', type: 1 },
      ]);
    });
  });

  describe('#insertOne', () => {
    beforeEach(async () => {
      await mysqlConnection.execute('DROP TABLE IF EXISTS `tests2`');
      await mysqlConnection.execute(
        'CREATE TABLE `tests2` (`id` INT(11) NOT NULL AUTO_INCREMENT, `name` CHAR(100) NOT NULL, PRIMARY KEY (id))',
      );
    });

    afterEach(async () => {
      await mysqlConnection.query('DROP TABLE IF EXISTS `tests2`');
    });

    it('throw an error if row is missing or empty', async () => {
      let error;
      try {
        await mysqlConector.insertOne('tests2', {});
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Invalid or empty row object');
    });

    it('inserts one row in the table (with auto-increment)', async () => {
      const { affectedRows, insertId } = await mysqlConector.insertOne(
        'tests2',
        { name: 'John Doe' },
      );

      expect({ affectedRows, insertId }).to.deep.equal({
        affectedRows: 1,
        insertId: 1,
      });

      const rows = await mysqlConector.findMany('tests2');
      expect(rows).to.deep.equal([{ id: 1, name: 'John Doe' }]);
    });
  });
});
