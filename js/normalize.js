// const _ = require('underscore');
// const { normalize, schema } = require('normalizr');

// const teams = new schema.Entity('_root');

// const member = new schema.Entity('members');
// const repository = new schema.Entity('repositories');
// const team = new schema.Entity('teams');


// teams.define({
//     items: [team]
// });

// team.define({
//     members: [member],
//     repositories: [repository]
// });

// const mergeIntoEntity = (entityA, entityB) => {
//     for (const key in entityB) {
//         if (!entityB.hasOwnProperty(key)) {
//             continue;
//         }
//         entityA[key] = entityB[key];
//     }
// };

// const removeNodes = nodes => {
//     return _.map(nodes, team => {
//         const { members: { nodes: members }, repositories: { nodes: repositories } } = team;
//         return { ...team, members, repositories };
//     });
// }

// const process = obj => {
//     const id = _.now();
//     const { data: { organization: { teams: { nodes } } } } = obj;
//     const items = removeNodes(nodes);
//     const { entities } = normalize({ id, items }, teams, { mergeIntoEntity });
//     return _.omit(entities, ['_root']);
// };

const process = obj => obj;

module.exports = process;