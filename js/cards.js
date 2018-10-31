const { UI } = require('watsonworkspace-sdk');
const _ = require('underscore');

const actions = require('./actions');
const constants = require('./constants');
const strings = require('./strings');

const cards = {
    getCards: (data, sortKey, card) => _.chain(data).sortBy(sortKey).map(card).value(),
    getService: data => {
        const { id, name = '', description, people = [] } = data;
        const subTitle = strings.usePlural('contact', people);
        const actionId = actions.getActionId(constants.ACTION_GET_DETAILS, [id]);
        const date = (_.now() - 60000);
        return UI.card(description, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
    },
    getRepository: data => {
        const { id, name, url, updatedAt } = data;
        const subTitle = constants.LAST_UPDATED;
        const actionId = actions.getActionId(constants.ACTION_GET_COMMITTERS, [id, name]);
        const date = new Date(updatedAt).getTime();
        return UI.card(name, subTitle, url, [UI.cardButton(constants.buttons.GET_COMMITTERS, actionId)], date);
    },
    getTeam: (data, repositoryName) => {
        const { id, members, name, updatedAt } = data;
        const subTitle = constants.LAST_UPDATED;
        const actionId = actions.getActionId(constants.ACTION_VIEW_COMMITTERS, [id, name, repositoryName]);
        const date = new Date(updatedAt).getTime();
        const body = strings.usePlural('committer', members);
        return UI.card(name, subTitle, body, [UI.cardButton(constants.buttons.VIEW_COMMITTERS, actionId)], date);
    }
}

Object.assign(cards, {
    SERVICE: cards.getService,
    REPOSITORY: cards.getRepository,
    TEAM: cards.getTeam
});

module.exports = cards;