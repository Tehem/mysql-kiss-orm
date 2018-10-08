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

  afterEach(() => {
    sandbox.restore();
  });

  after(async () => {
    await mysqlConnection.end();
  });

  describe('#findMany', () => {
    const mysql = new MysqlConnector(mysqlConfig);
    const dropSQL = 'DROP TABLE IF EXISTS `tests`';
    const createSQL =
      'CREATE TABLE `tests` (`id` INT(11) NOT NULL, `name` VARCHAR(100) NOT NULL, `type` INT(1) NOT NULL)';
    const insertSQL =
      "INSERT INTO `tests` VALUES(1, 'test 1', 1), (2, 'test 2', 3), (3, 'test 3', 2)";
    beforeEach(async () => {
      await mysqlConnection.execute(dropSQL);
      await mysqlConnection.execute(createSQL);
      await mysql.connect();
    });

    afterEach(async () => {
      await mysqlConnection.query(dropSQL);
      await mysql.disconnect();
    });

    it('finds no matching rows in table', async () => {
      await mysqlConnection.execute(insertSQL);
      const rows = await mysql.findMany('tests', { type: 0 });
      expect(rows).to.deep.equal([]);
    });

    it('finds all rows in table', async () => {
      await mysqlConnection.execute(insertSQL);
      const rows = await mysql.findMany('tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'test 1', type: 1 },
        { id: 2, name: 'test 2', type: 3 },
        {
          id: 3,
          name: 'test 3',
          type: 2,
        },
      ]);
    });

    it('returns only required fields from matching rows in table', async () => {
      await mysqlConnection.execute(insertSQL);
      const rows = await mysql.findMany('tests', {}, ['name']);
      expect(rows).to.deep.equal([
        { name: 'test 1' },
        { name: 'test 2' },
        { name: 'test 3' },
      ]);
    });
  });
});
