'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Querying', () => {
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
  });

  afterEach(async () => {
    sandbox.restore();
    await mysqlConnection.query('DROP TABLE IF EXISTS `tests`');
  });

  after(async () => {
    await mysqlConnection.end();
  });

  describe('#insertMany', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

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
});
