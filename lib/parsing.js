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

module.exports = {
  getFieldsList,
  getQueryPart,
  getSortingPart,
};
