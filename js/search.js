const FuzzySearch = require('fuzzy-search');

const constants = require('./constants');

const search = (data, term) => {
    return (new FuzzySearch(data, constants.SEARCH_KEYS, constants.SEARCH_OPTIONS)).search(term);
}

module.exports = search;