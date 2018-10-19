const _ = require('underscore');
const Q = require('q');

const db = require('../db');

const constants = require('../js/constants');
const search = require('../js/search');

const api = {
    getService: txt => {
        return db.getDOC(constants.db.DOCS.SERVICES).then(({ services = []}) => {
            if(services.length) {
                return Q.allSettled(_.map(search(services, txt), api.getPeople)).then(data => _.pluck(data, 'value'));
            }
        });
    },
    getPeople: service => {
        return db.getDOC(constants.db.DOCS.PEOPLE).then(({ people = []}) => {
            return {
                ...service,
                people: _.chain(people).indexBy('id').pick(service.people).values().value()
            };
        });
    }
}

module.exports = api;