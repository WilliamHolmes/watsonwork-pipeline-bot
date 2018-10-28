const _ = require('underscore');
const { normalize, schema } = require('normalizr');

const teams = new schema.Entity('_root');

const member = new schema.Entity('members');
const repository = new schema.Entity('repositories');
const team = new schema.Entity('teams');


teams.define({
    items: [team]
});

team.define({
    members: [member],
    repositories: [repository]
});

const mergeIntoEntity = (entityA, entityB) => {
    for (const key in entityB) {
        if (!entityB.hasOwnProperty(key)) {
            continue;
        }
        entityA[key] = entityB[key];
    }
};

const process = obj => {
    const id = _.now();
    const { data: { organization: { teams: { nodes } } } } = obj;
    const items = _.map(nodes, node => {
        const { members: { nodes: members }, repositories: { nodes: repositories } } = node;
        return { ...node, members, repositories };
    });
    const { entities } = normalize({ id, items }, teams, { mergeIntoEntity });
    return _.omit(entities, ['_root']);
};

module.exports = process;