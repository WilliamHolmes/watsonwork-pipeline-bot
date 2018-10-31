
const constants = require('./constants');
const strings = require('./strings');

const actions = {
    getActionId = (key, data) => {
        return `${key}${data.join(constants.SPLITTER)}`;
    },
    getActionData = (id, actionId) => {
        return strings.chompLeft(id, actionId).split(constants.SPLITTER);
    },
    getPlural = (text, data) => {
        return `${data.length} ${text}${data.length === 1 ? '' : 's'}`;
    }
}

module.exports = actions;