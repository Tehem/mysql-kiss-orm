'use strict';

const _ = require('lodash');

/**
 * Get field list for query
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
 * Get the WHERE part of a query
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

module.exports = {
  getFieldsList,
  getQueryPart,
};
