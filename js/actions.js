
const constants = require('./constants');
const strings = require('./strings');

const actions = {
    getActionId: (key, data) => {
        console.log('TCL: getActionId data', data);
        return `${key}${data.join(constants.SPLITTER)}`;
    },
    getActionData: (id, actionId) => {
        return strings.chompLeft(id, actionId).split(constants.SPLITTER);
    }
}

module.exports = actions;