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
        console.log('TCL: getTeamsData');
        return fetch('https://github.ibm.com/api/graphql', {
            method: 'POST',
            body: JSON.stringify({ query }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GIT_TOSCANA_TOKEN}`
            }
        }).then(res => res.json());
    },
    getRepository: name => {
        return api.getRepositories().then(repositories => {
            return search(_.values(repositories), name, constants.search.REPOSITORY_KEYS)
        });
    },
    getRepositories: () => {
        console.log('TCL: getRepositories');
        return db.getDOC(constants.db.DOCS.TEAMS).then(({ repositories }) => {
            console.log('TCL: getRepositories repositories', repositories);
            if (_.isEmpty(repositories)) {
                return api.getTeamsData().then(api.updateRepositories);
            }
            return repositories;
        });
    },
    updateRepositories: obj => {
        console.log('updateRepositories: obj', obj);
        return db.updateDOC(constants.db.DOCS.TEAMS, normalize(obj));
    }
}

module.exports = api;