'use strict';

const _ = require('lodash');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

const parsingLib = require('./parsing');
const sqlLib = require('./sql');

module.exports = class MysqlConnector extends EventEmitter {
  /**
   * MySQL connector class
   *
   * @param {object} config Connector configuration
   * @param {string} config.host mysql host
   * @param {string} config.user mysql user
   * @param {string} config.password mysql user's password
   * @param {string} config.database mysql database name
   */
  constructor(config) {
    super();

    /**
     * Connector configuration
     */
    this.config = Object.assign(
      {},
      _.pick(config, ['host', 'user', 'password', 'database']),
    );

    // for log / debug
    this.lastSql = '';
    this.lastPlaceHolders = [];
  }

  /**
   * Connect the database
   *
   * @throws Error on connection issue
   *
   * @returns {void}
   */
  async connect() {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
    });
    this.emit('connected', this);
  }

  /**
   * Disconnect the database
   * @returns {void}
   */
  async disconnect() {
    try {
      if (this.connection && !this.connection._closing) {
        await this.connection.end();
      }
      this.connection = null;
    } finally {
      this.emit('disconnected', this);
    }
  }

  /**
   * Get the last executed query with SQL and placeholders values
   *
   * @returns {string} the query with placeholders
   */
  getLastQuery() {
    return `${this.lastSql} [${this.lastPlaceHolders.join(', ')}]`;
  }

  /**
   * Execute a query
   * @param {string} statement sql statement with '?' placeholders
   * @param {string[]} placeholders values to bind to placeholders
   * @returns {Object} results
   * @returns {Array} results.rows matching rows
   * @returns {Object} results.fields extra meta data about results
   */
  query(statement, placeholders = []) {
    this.lastSql = statement;
    this.lastPlaceHolders = placeholders;
    return this.connection.execute(statement, placeholders);
  }

  /**
   * Returns matching rows count for a given query
   *
   * @param {String} tableName name of the table in DB
   * @param {Object} [query] the query restrictions (WHERE)
   * @return {Number} count of matching rows
   */
  async count(tableName, query = {}) {
    const placeholders = Object.values(query);
    const sql = sqlLib.buildCountSql(tableName, query);
    const [rows] = await this.query(sql, placeholders);
    return rows[0].counter;
  }

  /**
   * Returns matching rows for a given query
   *
   * @param {String} tableName name of the table in DB
   * @param {Object} [query] the query restrictions (WHERE)
   * @param {Object} options request options
   * @param {Array} [options.projections] optional projection of results fields
   * @param {Object} [options.sort] optional sorting for results
   * @param {Number} [options.limit] optional limit for results
   * @param {Number} [options.offset] optional offset for results
   * @returns {Array} all matching rows
   */
  async findMany(
    tableName,
    query = {},
    options = { projections: [], sort: {}, limit: 0, offset: 0 },
  ) {
    const placeholders = Object.values(query);
    const sql = sqlLib.buildFindSql(tableName, query, options);
    const [rows] = await this.query(sql, placeholders);
    return rows;
  }

  /**
   * Returns one row for the matching query
   *
   * @param {String} tableName name of the table in DB
   * @param {Object} [query] the query restrictions (WHERE)
   * @param {Object} options request options
   * @param {Array} [options.projections] optional projection of results fields
   * @returns {Object|null} matching row or null if none found
   */
  async findOne(tableName, query = {}, options = { projections: [] }) {
    const rows = await this.findMany(
      tableName,
      query,
      Object.assign({}, options, { limit: 1 }),
    );
    return _.head(rows) || null;
  }

  /**
   * Insert rows in a table
   *
   * @param {String} tableName name of the table to insert into
   * @param {Object[]} rows the rows objects to insert
   * @returns {Object} insert result object
   */
  async insertMany(tableName, rows) {
    if (!rows || rows.length <= 0) {
      throw new Error(
        'Invalid parameter for rows, must be an array of objects',
      );
    }

    const insertFields = Object.keys(rows[0]).sort();
    const commonFields = parsingLib.getCommonFields(rows);

    if (_.difference(insertFields, commonFields).length !== 0) {
      throw new Error('Inconsistent object keys among row objects');
    }

    const sql = sqlLib.buildInsertSql(tableName, insertFields, rows.length);
    const placeholders = parsingLib.getInsertValues(rows);

    const [results] = await this.query(sql, placeholders);
    return results;
  }

  /**
   * Insert one row in table
   *
   * @param {String} tableName name of the table to insert into
   * @param {Object} row the row object to insert
   * @returns {Object} insert result object
   */
  async insertOne(tableName, row) {
    // please note that hypothetically for a table with all fields having
    // default value (!!), this will be a problem... nevertheless, this
    // edge case does not justify to design a complex check here.
    if (_.isEmpty(row)) {
      throw new Error('Invalid or empty row object');
    }

    const sql = sqlLib.buildInsertSql(tableName, Object.keys(row).sort(), 1);
    const placeholders = parsingLib.getInsertValues([row]);

    const [results] = await this.query(sql, placeholders);
    return results;
  }

  /**
   * Update multiple rows in table
   *
   * @param {String} tableName name of the table in DB
   * @param {Object} match the update restrictions (WHERE)
   * @param {Object} sets the update modifications (SET)
   * @param {Object} options update options
   * @param {Object} [options.sort] optional sorting for row
   * update (useful if limit is set)
   * @param {Number} [options.limit] optional row count limit
   * for update
   * @return {Object} update result object
   */
  async updateMany(tableName, match, sets, options = { sort: {}, limit: 0 }) {
    if (_.isEmpty(sets)) {
      throw new Error('Invalid or empty sets object for update');
    }

    const sql = sqlLib.buildUpdateSql(tableName, match, sets, options);
    const placeholders = Object.values(sets).concat(Object.values(match));
    const [results] = await this.query(sql, placeholders);
    return results;
  }

  /**
   * Update one document (the first matching) in table
   *
   * @param {String} tableName name of the table in DB
   * @param {Object} match the update restrictions (WHERE)
   * @param {Object} sets the update modifications (SET)
   * @param {Object} options update options
   * @param {Object} [options.sort] optional sorting for row
   * @return {Object} update result object
   */
  updateOne(tableName, match, sets, options = { sort: {} }) {
    if (_.isEmpty(match)) {
      throw new Error('Empty matching object for single update');
    }
    return this.updateMany(
      tableName,
      match,
      sets,
      Object.assign({}, options, { limit: 1 }),
    );
  }
};
