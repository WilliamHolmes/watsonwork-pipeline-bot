const _ = require('underscore');
const Q = require('q');
const fetch = require('node-fetch');
const SDK = require('watsonworkspace-sdk');

const db = require('../db');

const query = require('../queries');

const constants = require('../js/constants');
const search = require('../js/search');
const strings = require('../js/strings');
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
            return Object.assign({}, service, {
                people: _.chain(people).indexBy('id').pick(service.people).values().value()
            });
        });
    },
    getTeamsData: () => {
        return fetch(constants.GIT_GQL, {
            method: 'POST',
            body: JSON.stringify({ query: query.getTeams() }),
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
        return db.getDOC(constants.db.DOCS.TEAMS).then(({ repositories }) => {
            if (_.isEmpty(repositories)) {
                return api.getTeamsData().then(api.updateRepositories);
            }
            return repositories;
        });
    },
    updateRepositories: obj => {
        return db.updateDOC(constants.db.DOCS.TEAMS, normalize(obj));
    },
    getCommitterTeams: repositoryId => {
        return db.getDOC(constants.db.DOCS.TEAMS).then(({ teams }) => {
            return _.chain(teams)
                .values()
                .filter(({ repositories }) => _.contains(repositories, repositoryId))
                .filter(({ name }) => strings.endsWith(name, constants.COMMITTERS_GROUP))
                .value();
        });
    },
    getTeam: teamId => {
        console.log('TCL: getTeam teamId', teamId);
        return db.getDOC(constants.db.DOCS.TEAMS).then(({ members: allMembers, teams }) => {
            const team = teams[teamId];
            console.log('TCL: getTeam team', team);
            if (_.isEmpty(team)) {
                return;
            }
            const members = _.chain(allMembers).pick(team.members).values().value();
            return Object.assign({}, team, { members });
        });
    },
    getPeople: (app, people) => {
        const q = query.getPeople(people);
        console.log('TCL: getPeople q', q);
        return app.sendGraphql(q).then(res => {
            console.log('TCL: getPeople res', res);
            // return _.values(res.data)
            return [];
        }).catch(e => {
            console.error('[ERROR] TCL: getPeople', e);
            throw new Error(e);
        });
    }
}

module.exports = api;