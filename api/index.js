const _ = require('underscore');
const Q = require('q');

const db = require('../db');

const query = require('../queries');

const constants = require('../js/constants');
const search = require('../js/search');
const normalize = require('../js/normalize');

const api = {
    getServiceById: id => {
        return db.getDOC(constants.db.DOCS.SERVICES).then(({ services = []}) => {
            if(services.length) {
                return Q.allSettled(_.map(_.where(services, { id }), api.getPeople)).then(data => _.pluck(data, 'value'));
            }
        });
    },
    getService: txt => {
        return db.getDOC(constants.db.DOCS.SERVICES).then(({ services = []}) => {
            if(services.length) {
                return Q.allSettled(_.map(search(services, txt, constants.search.SERVICE_KEYS), api.getPeople)).then(data => _.pluck(data, 'value'));
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
    },
    getTeamsData: () => {
        return fetch('https://github.ibm.com/api/graphql', {
            method: 'POST',
            body: JSON.stringify({ query }),
            headers: {
                'Content-Type': 'applciation/json',
                'Authorization': `Bearer ${process.env.GIT_TOSCANA_TOKEN}`
            }
        }).then(res => res.json());
    },
    getRepository: name => {
        return api.getRepositories().then(repositories => {
            return search(_.values(repositories), name, constants.search.REPOSITORY_KEYS)
        })
    },
    getRepositories: () => {
        return db.getDOC(constants.db.DOCS.TEAMS).then(({ repositories }) => {
            if (_.isEmpty(repositories)) {
                return api.getTeamsData().then(updateRepositories);
            }
            return repositories;
        });
    },
    updateRepositories: data => {
        const repositories = normalize(data);
        return db.insert(constants.db.DOCS.TEAMS, doc => ({ ...doc, ...repositories }), doc => doc).then(() => repositories);
    }
}

module.exports = api;