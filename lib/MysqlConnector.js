'use strict';

const { EventEmitter } = require('events');
const mysql = require('mysql2/promise');
const _ = require('lodash');

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
   * Execute a query on connection
   * @param {string} statement sql statement with '?'
   * @param {string[]} placeholders values to bind to placeholders
   * @returns {Promise<*>} results
   */
  // eslint-disable-next-line consistent-return
  async query(statement, placeholders = []) {
    const [rows] = await this.connection.execute(statement, placeholders);
    return rows;
  }
};
