'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Selecting rows', () => {
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

  describe('#count', () => {
    const mysqlConector = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysqlConector.connect();
    });

    afterEach(async () => {
      await mysqlConector.disconnect();
    });

    it('finds 0 matching rows in table', async () => {
      const count = await mysqlConector.count('tests', { type: 0 });
      expect(count).to.equal(0);
    });

    it('finds all rows in table', async () => {
      const count = await mysqlConector.count('tests');
      expect(count).to.equal(3);
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
