'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mysqlLib = require('mysql2/promise');

const MysqlConnector = require('../../lib/MysqlConnector');

describe('MysqlConnector', () => {
  const sandbox = sinon.createSandbox();
  const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe('#constructor', () => {
    it('initializes an instance with empty config', () => {
      const mysql = new MysqlConnector(null);
      expect(mysql.config).to.deep.equal({});
    });

    it('initializes an instance with valid config', () => {
      const mysql = new MysqlConnector(mysqlConfig);
      expect(mysql.config).to.deep.equal(mysqlConfig);
    });

    it('initializes an instance and discard invalid config values', () => {
      const mysql = new MysqlConnector(
        Object.assign(
          {
            test: 'invalid',
            parameter: false,
          },
          mysqlConfig,
        ),
      );
      expect(mysql.config).to.deep.equal(mysqlConfig);
    });
  });

  describe('#connect', () => {
    const mysql = new MysqlConnector(mysqlConfig);

    afterEach(async () => {
      await mysql.disconnect();
    });

    it('throws an error if an error occurs', async () => {
      const eventSpy = sandbox.spy();
      mysql.on('connected', eventSpy);
      const mysqlStub = sandbox
        .stub(mysqlLib, 'createConnection')
        .throws(new Error('Error connecting to database'));
      let error = null;

      try {
        await mysql.connect();
      } catch (err) {
        error = err;
      }

      expect(mysql.connection).to.equal(undefined);
      expect(mysqlStub.calledWith(mysqlConfig)).to.equal(true);
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Error connecting to database');
      expect(eventSpy.called).to.equal(false);
    });

    it('connects to the mysql server successfully', async () => {
      const eventSpy = sandbox.spy();
      const errorEventSpy = sandbox.spy();
      mysql.on('connected', eventSpy);
      mysql.on('error', errorEventSpy);
      await mysql.connect();

      expect(mysql.connection).to.not.equal(null);
      expect(eventSpy.calledOnce).to.equal(true);
      expect(errorEventSpy.called).to.equal(false);
    });
  });

  describe('#disconnect', () => {
    const mysql = new MysqlConnector(mysqlConfig);

    it('throws an error if an error occurs', async () => {
      await mysql.connect();

      const eventSpy = sandbox.spy();
      mysql.on('disconnected', eventSpy);
      sandbox
        .stub(mysqlLib.PromiseConnection.prototype, 'end')
        .throws(new Error('Error disconnecting from database'));
      let error;

      try {
        await mysql.disconnect();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal('Error disconnecting from database');
      expect(mysql.connection).to.not.equal(null);
      expect(eventSpy.called).to.equal(true);

      sandbox.restore();
      await mysql.disconnect();
      expect(mysql.connection).to.equal(null);
    });

    it('handles gracefully if connection is already closed / closing', async () => {
      const eventSpy = sandbox.spy();
      const errorEventSpy = sandbox.spy();
      mysql.on('disconnected', eventSpy);
      mysql.on('error', errorEventSpy);
      await mysql.disconnect();

      expect(mysql.connection).to.equal(null);
      expect(eventSpy.calledOnce).to.equal(true);
      expect(errorEventSpy.called).to.equal(false);
    });

    it('closes the connection successfully', async () => {
      await mysql.connect();

      const eventSpy = sandbox.spy();
      const errorEventSpy = sandbox.spy();
      mysql.on('disconnected', eventSpy);
      mysql.on('error', errorEventSpy);
      await mysql.disconnect();

      expect(mysql.connection).to.equal(null);
      expect(eventSpy.calledOnce).to.equal(true);
      expect(errorEventSpy.called).to.equal(false);
    });
  });

  describe('#query', () => {
    const mysql = new MysqlConnector(mysqlConfig);

    beforeEach(async () => {
      await mysql.connect();
    });

    afterEach(async () => {
      await mysql.disconnect();
    });

    it('throws an error on invalid query', async () => {
      let error;
      let rows;
      try {
        rows = await mysql.query('SELECT FALSE FROM', []);
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
        rows = await mysql.query('SELECT ? AS test FROM DUAL', null);
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
      const rows = await mysql.query("SELECT 'test' AS TEST FROM DUAL");
      expect(rows).to.deep.equal([{ TEST: 'test' }]);
    });

    it('performs a query against database with placeholders', async () => {
      const rows = await mysql.query(
        "SELECT 'test' AS TEST, ? AS TEST2 FROM DUAL",
        ['test2'],
      );
      expect(rows).to.deep.equal([{ TEST: 'test', TEST2: 'test2' }]);
    });
  });
});
