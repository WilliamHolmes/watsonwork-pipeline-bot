const _ = require('underscore');
const Cloudant = require('cloudant');
const Q = require('q');

const db = require('../db');

const constants = require('../js/constants');

const api = {
    getService: txt => {
        console.log('***** TCL: getService txt', txt);
        return db.getDOC(constants.db.DOCS.SERVICES).then(({ services = []}) => {
            const res = _.filter(services, ({ name, description }) => (`${name} ${description}`.toLowerCase().includes(txt.toLowerCase())));
            console.log('TCL: getService services', services);
            if(services.length) {
                console.log('TCL: getService  GET PEOPLE')
                return Q.allSettled(_.map(res, api.getPeople)).then(data => _.pluck(data, 'value'));
            }
        });
    },
    getPeople: service => {
        return db.getDOC(constants.db.DOCS.PEOPLE).then(({ people = []}) => {
            console.log('TCL: getPeople', people.length, service.people.length);
            people = _.chain(people).indexBy('id').pick(service.people).values().value();
            return {
                ...service,
                people
            };
        });
    }
    /*
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