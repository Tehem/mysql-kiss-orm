'use strict';

const _ = require('lodash');

const parsingLib = require('./parsing');

/**
 * Build a query sorting operand
 * @param {Object} sort the sort operation to apply
 * @see parsingLib.getSortingPart
 * @return {string} the query order string part
 */
function buildSortingSql(sort) {
  return parsingLib.getSortingPart(sort);
}

/**
 * Build a query limit/offset operand
 * @param {String} [limit] the limit to apply if any
 * @param {String} [offset] the offset to apply if any
 * @return {string} the query limit/offset string part
 */
function buildLimitOffsetSql(limit, offset) {
  let sql = '';

  if (Number.isInteger(limit) && limit > 0) {
    sql = `${sql} LIMIT ${limit}`;

    if (Number.isInteger(offset) && offset > 0) {
      sql = `${sql} OFFSET ${offset}`;
    }
  }

  return sql;
}

/**
 * Build a SELECT SQL statement
 * @param {String} tableName the table name
 * @param {Object} query the query restrictions (WHERE)
 * @param {Object} [options] optional parameters
 * @param {Array} [options.projections] optional projection of results fields
 * @param {Object} [options.sort] optional sorting for results
 * @param {Number} [options.limit] optional limit for results
 * @param {Number} [options.offset] optional offset for results
 * @return {string} the SQL statement
 */
function buildFindSql(
  tableName,
  query,
  options = { projections: [], sort: {}, limit: 0, offset: 0 },
) {
  return (
    `SELECT ${parsingLib.getFieldsList(options.projections)} ` +
    `FROM ${tableName} WHERE ${parsingLib.getQueryPart(query)}` +
    `${buildSortingSql(options.sort)}` +
    `${buildLimitOffsetSql(options.limit, options.offset)}`
  );
}

/**
 * Build an INSERT SQL statement
 * @param {String} tableName the table name
 * @param {Array} fields the fields to insert to
 * @param {Number} rowCount the expected number of rows
 * to insert (for placeholders)
 * @return {string} the SQL statement
 */
function buildInsertSql(tableName, fields, rowCount = 1) {
  const rowplaceHolders = _.fill(Array(fields.length), '?').join(',');
  const rowsPlaceholders = _.fill(Array(rowCount), rowplaceHolders).join('),(');
  return (
    `INSERT INTO ${tableName} (${fields.join(',')}) ` +
    `VALUES (${rowsPlaceholders})`
  );
}

/**
 * Build an UPDATE SQL statement
 * @param {String} tableName the table name
 * @param {Object} match the update matching restrictions (WHERE)
 * @param {Object} sets the update modifications (SET)
 * @param {Object} [options] optional parameters
 * @param {Object} [options.sort] optional sorting for results
 * @param {Number} [options.limit] optional limit for results
 * @return {string} the SQL statement
 */
function buildUpdateSql(
  tableName,
  match,
  sets,
  options = { sort: {}, limit: 0 },
) {
  const setPart = _.map(Object.keys(sets), field => `${field}=?`).join(',');
  return (
    `UPDATE ${tableName} SET ${setPart} ` +
    `WHERE ${parsingLib.getQueryPart(match)}` +
    `${buildSortingSql(options.sort)}` +
    `${buildLimitOffsetSql(options.limit)}`
  );
}

module.exports = { buildFindSql, buildInsertSql, buildUpdateSql };
