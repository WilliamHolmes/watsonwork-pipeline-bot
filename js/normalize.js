const _ = require('underscore');
const { normalize, Schema, arrayOf } = require('normalizr');

const teams = new Schema('_root');

const member = new Schema('members');
const repository = new Schema('repositories');
const team = new Schema('teams');


teams.define({
    items: arrayOf(team)
});

team.define({
    members: arrayOf(member),
    repositories: arrayOf(repository)
});

const mergeIntoEntity = (entityA, entityB) => {
    for (const key in entityB) {
        if (!entityB.hasOwnProperty(key)) {
            continue;
        }
        entityA[key] = entityB[key];
    }
};

export default obj => {
    const id = _.now();
    const { data: { organization: { teams: { nodes } } } } = obj;
    const items = _.map(nodes, node => {
        const { members: { nodes: members }, repositories: { nodes: repositories } } = node;
        return { ...node, members, repositories };
    });
    const { entities } = normalize({ id, items }, teams, { mergeIntoEntity });
    return _.omit(entities, ['_root']);
};
