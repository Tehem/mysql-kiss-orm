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

  describe('#findMany', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

    it('finds no matching rows in table', async () => {
      const rows = await mysqlConector.findMany('tests', { type: 0 });
      expect(rows).to.deep.equal([]);
    });

    it('finds all rows in table', async () => {
      const rows = await mysqlConector.findMany('tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'test 1', type: 1 },
        { id: 2, name: 'test 2', type: 3 },
        {
          id: 3,
          name: 'test 3',
          type: 3,
        },
      ]);
    });

    it('handles limit and offset parameter', async () => {
      const rows = await mysqlConector.findMany(
        'tests',
        {},
        { limit: 1, offset: 1 },
      );
      expect(rows).to.deep.equal([{ id: 2, name: 'test 2', type: 3 }]);
    });

    it('returns only required fields from matching rows in table', async () => {
      const rows = await mysqlConector.findMany(
        'tests',
        {},
        { projections: ['name'] },
      );
      expect(rows).to.deep.equal([
        { name: 'test 1' },
        { name: 'test 2' },
        { name: 'test 3' },
      ]);
    });

    it('returns all matching rows with a sort applied', async () => {
      const rows = await mysqlConector.findMany(
        'tests',
        {},
        { sort: { type: 'DESC', id: 'ASC' } },
      );
      expect(rows).to.deep.equal([
        { id: 2, name: 'test 2', type: 3 },
        { id: 3, name: 'test 3', type: 3 },
        { id: 1, name: 'test 1', type: 1 },
      ]);
    });
  });

  describe('#findOne', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

    it('finds no matching row', async () => {
      const row = await mysqlConector.findOne('tests', { id: 4 });
      expect(row).to.deep.equal(null);
    });

    it('finds one row', async () => {
      const row = await mysqlConector.findOne('tests');
      expect(row).to.deep.equal({ id: 1, name: 'test 1', type: 1 });
    });

    it('finds one matching row with projections', async () => {
      const row = await mysqlConector.findOne(
        'tests',
        { id: 3 },
        { projections: ['name'] },
      );
      expect(row).to.deep.equal({ name: 'test 3' });
    });

    it('finds one matching row if more than one row matches', async () => {
      const row = await mysqlConector.findOne('tests', { type: 3 });
      expect(row).to.deep.equal({ id: 2, name: 'test 2', type: 3 });
    });
  });
});
