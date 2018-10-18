const _ = require('underscore');
const Cloudant = require('cloudant');

const db = require('../db');

const constants = require('../js/constants');

const api = {
    getService: txt => {
        return db.getDOC(constants.db.DOCS.SERVICES).then(({ [constants.db.keys.SERVICES]: services = []}) => {
            return _.filter(services, ({ name, description }) => (`${name} ${description}`.toLowerCase().includes(txt.toLowerCase())));
        });
    }/* 
    getServices: () => {

    }
    isRickRoll: url  => {
        return api.hasURL(url, constants.db.keys.CONFIRMED);
    },
    isIgnored: url => {
        return api.hasURL(url, constants.db.keys.IGNORED);
    },
    addRickRoll: url => {
        return db.insert(api.addURL(url, constants.db.keys.CONFIRMED), api.removeURL(url, constants.db.keys.CONFIRMED));
    },
    ignoreRickRoll: url => {
        return db.insert(api.addURL(url, constants.db.keys.IGNORED), api.removeURL(url, constants.db.keys.IGNORED));
    },
    addURL: (url, key) => doc => { doc[key] = _.union(doc[key], [url]); return doc; },
    removeURL: (url, key) => doc => { doc[key] = _.without(doc[key], url); return doc; },
    hasURL: (url, key) => {
        return db.getDOC()
            .then(({ [key]: data = [] }) =>  _.some(data, item => url.toLowerCase().includes(item.toLowerCase())))
            .catch(err => false);
    } */
}

module.exports = api;