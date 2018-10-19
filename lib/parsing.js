'use strict';

const _ = require('lodash');

/**
 * Build the field list part of a query
 * @param {Array} projections list of fields
 * @returns {String} the field list string
 * @private
 */
function getFieldsList(projections) {
  if (!projections || projections.length <= 0) {
    return '*';
  }

  return projections.join();
}

/**
 * Build the WHERE part of a query
 * @param {Object} query the query object
 * @returns {String} the where clause string
 */
function getQueryPart(query) {
  if (_.isEmpty(query)) {
    return '1';
  }
  const keys = Object.keys(query);
  return _.map(keys, field => `${field}=?`).join(' AND ');
}

/**
 * Build the ORDER BY part of a query
 * @param {Object} sort the sort parameters
 * @returns {string} empty string if no sort, or an ORDER BY string else
 */
function getSortingPart(sort) {
  if (_.isEmpty(sort)) {
    return '';
  }

  const sortingParts = _.compact(
    _.map(sort, (direction, field) => {
      if (!direction) return null;
      return `${field} ${direction.toUpperCase()}`;
    }),
  );

  if (sortingParts.length === 0) {
    return '';
  }

  return `ORDER BY ${sortingParts.join(', ')}`;
}

/**
 * Returns a reduced, sorted array of common fields among all rows.
 * If some rows have extra keys, they will be removed.
 *
 * Example:
 * getCommonFields([
 * { id: 4, name: 'john doe', gender: 'male', address: '4 philip street' },
 * { id: 8, surname: 'Moka', name: 'joe Mocha', phone: '+33687985241' },
 * ])
 * => ['id', 'name']
 *
 * @param {Object[]} rows the rows to compare and reduce
 * @returns {Array} the common fields
 */
function getCommonFields(rows) {
  if (rows.length === 1) {
    return Object.keys(rows[0]).sort();
  }
  return _.reduce(
    rows,
    (res, val) => _.intersection(res, Object.keys(val)),
    Object.keys(rows[0]),
  ).sort();
}

/**
 * Sort/Order an object by its keys (alphabetically)
 * @param {Object} obj the object to sort
 * @returns {Object} the sorted object
 */
function sortObjectByKeys(obj) {
  const orderedObj = {};
  Object.keys(obj)
    .sort()
    .forEach(key => {
      orderedObj[key] = obj[key];
    });
  return orderedObj;
}

/**
 * Build the placeholders array for an INSERT query
 * This sorts object values and aggregates in an array of values
 *
 * @param {Object[]} rows the rows to insert
 * @returns {Array} the insert values placeholders
 */
function getInsertValues(rows) {
  return _.flatten(_.map(rows, row => Object.values(sortObjectByKeys(row))));
}

module.exports = {
  getFieldsList,
  getQueryPart,
  getSortingPart,
  getCommonFields,
  sortObjectByKeys,
  getInsertValues,
};
