'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('Deleting rows', () => {
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
        "(3, 'test 3', 3, 'FR')," +
        "(4, 'test 4', 3, 'PT')",
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

  describe('#deleteMany', () => {
    it('throws and error if match parameter is invalid', async () => {
      let error;
      try {
        await mysqlConector.deleteMany('tests', null);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal(
        'Invalid or empty match object for delete',
      );
    });

    it('deletes all matching rows without restriction', async () => {
      const results = await mysqlConector.deleteMany('tests', {
        type: 3,
        country: 'FR',
      });
      expect(results.affectedRows).to.equal(2);
      const [rows] = await mysqlConnection.query('SELECT * FROM tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'test 1', type: 1, country: 'FR' },
        { id: 4, name: 'test 4', type: 3, country: 'PT' },
      ]);
    });

    it('deletes all matching rows with limit', async () => {
      const results = await mysqlConector.deleteMany(
        'tests',
        {
          country: 'FR',
        },
        { limit: 2 },
      );
      expect(results.affectedRows).to.equal(2);
      const [rows] = await mysqlConnection.query('SELECT * FROM tests');
      expect(rows).to.deep.equal([
        { id: 3, name: 'test 3', type: 3, country: 'FR' },
        { id: 4, name: 'test 4', type: 3, country: 'PT' },
      ]);
    });
  });

  describe('#deleteOne', () => {
    it('throws and error if match parameter is invalid', async () => {
      let error;
      try {
        await mysqlConector.deleteOne('tests', {});
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Empty matching object for single delete');
    });

    it('delete first matching row in table using sort', async () => {
      const results = await mysqlConector.deleteOne(
        'tests',
        { country: 'FR', type: 3 },
        { sort: { id: 'DESC' } },
      );
      expect(results.affectedRows).to.equal(1);
      const [rows] = await mysqlConnection.query('SELECT * FROM tests');
      expect(rows).to.deep.equal([
        { id: 1, name: 'test 1', type: 1, country: 'FR' },
        { id: 2, name: 'test 2', type: 3, country: 'FR' },
        { id: 4, name: 'test 4', type: 3, country: 'PT' },
      ]);
    });
  });
});
