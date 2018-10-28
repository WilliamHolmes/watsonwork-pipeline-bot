const FuzzySearch = require('fuzzy-search');

const constants = require('./constants');

const search = (data, term, keys) => {
    return (new FuzzySearch(data, keys, constants.search.OPTIONS)).search(term);
};

module.exports = search;