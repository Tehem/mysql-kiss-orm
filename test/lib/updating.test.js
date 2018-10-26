'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Updating rows', () => {
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
      'CREATE TABLE `tests` (`id` INT(11) NOT NULL, ' +
        '`name` VARCHAR(100) NOT NULL, `type` INT(1) NOT NULL, ' +
        '`country` VARCHAR(2) NOT NULL)',
    );
    await mysqlConnection.execute(
      'INSERT INTO `tests` VALUES(' +
        "1, 'test 1', 1, 'FR'), " +
        "(2, 'test 2', 3, 'FR'), " +
        "(3, 'test 3', 3, 'PT')," +
        "(4, 'test 4', 1, 'FR')",
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

  describe('#updateMany', () => {
    it('throws and error if sets parameter is invalid', async () => {
      let error;
      try {
        await mysqlConector.updateMany('tests', {}, null);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Invalid or empty sets object for update');
    });

    it('updates one field on many rows without restriction', async () => {
      const results = await mysqlConector.updateMany('tests', {}, { type: 5 });
      expect(results.affectedRows).to.equal(4);
      expect(results.changedRows).to.equal(4);
      const [rows] = await mysqlConnection.query('SELECT * FROM tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'test 1', type: 5, country: 'FR' },
        { id: 2, name: 'test 2', type: 5, country: 'FR' },
        { id: 3, name: 'test 3', type: 5, country: 'PT' },
        { id: 4, name: 'test 4', type: 5, country: 'FR' },
      ]);
    });

    it('updates several fields with match restriction', async () => {
      const results = await mysqlConector.updateMany(
        'tests',
        { country: 'FR', type: 1 },
        { type: 5, name: 'updated' },
      );
      expect(results.affectedRows).to.equal(2);
      expect(results.changedRows).to.equal(2);
      const [rows] = await mysqlConnection.query('SELECT * FROM tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'updated', type: 5, country: 'FR' },
        { id: 2, name: 'test 2', type: 3, country: 'FR' },
        { id: 3, name: 'test 3', type: 3, country: 'PT' },
        { id: 4, name: 'updated', type: 5, country: 'FR' },
      ]);
    });
  });
});
