'use strict';

const _ = require('lodash');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

const parsingLib = require('./parsing');

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
   * Execute a query
   * @param {string} statement sql statement with '?' placeholders
   * @param {string[]} placeholders values to bind to placeholders
   * @returns {Array} row results
   */
  async query(statement, placeholders = []) {
    const [rows] = await this.connection.execute(statement, placeholders);
    return rows;
  }

  /**
   * Returns a cursor on lots for a given query.
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
  findMany(
    tableName,
    query = {},
    options = { projections: [], sort: {}, limit: 0, offset: 0 },
  ) {
    const placeholders = Object.values(query);
    let sql = `
      SELECT ${parsingLib.getFieldsList(options.projections)} 
      FROM ${tableName} 
      WHERE ${parsingLib.getQueryPart(query)} 
      ${parsingLib.getSortingPart(options.sort)}`;

    if (Number.isInteger(options.limit) && options.limit > 0) {
      sql = `${sql} LIMIT ${options.limit}`;

      if (Number.isInteger(options.offset) && options.offset > 0) {
        sql = `${sql} OFFSET ${options.offset}`;
      }
    }
    return this.query(sql, placeholders);
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
};
