const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const UI = require('watsonworkspace-sdk').UI;

const constants = require('./js/constants');
const strings = require('./js/strings');
const API = require('./api');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const getCard = data => {
    const { name = '', description, people = [] } = data;
    const subTitle = `${people.length} contact${people.length == 1 ? '' : 's'}`;
    const actionId = `${constants.ACTION_GET_DETAILS}${JSON.stringify({ name, description })}`;
    const date = (_.now() - 60000);
    return UI.card(description, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
}

const getCards = services => _.chain(services).sort('description').map(getCard).value();

const serviceNotFound = (serviceName, message, annotation) => {
    app.sendTargetedMessage(message.userId, annotation, UI.generic(constants.SERVICE_NOT_FOUND, `${serviceName} - not found.`))
}

const serviceFound = (message, annotation, services) => {
    app.sendTargetedMessage(message.userId, annotation, getCards(services));
}

const getService = (message, annotation, params) => {
    const serviceName = _.first(params);
    API.getService(serviceName).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }
        serviceFound(message, annotation, services);
    }).catch(() => serviceNotFound(serviceName, message, annotation));
}

const onGetServiceDetails = (message, annotation) => {
    const { userId } = message;
    const { actionId = '' } = annotation;
    const { name, description } = JSON.parse(strings.chompLeft(actionId, constants.ACTION_GET_DETAILS));
    API.getService(description).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }
        const { people, repo } = _.first(services);
        const link = `${constants.GIT_REPO}/${repo}`
        const contacts = _.map(people, ({ id, displayName }) => `<@${id}|${strings.titleCase(displayName)}>`).join('\n');
        const body = [link, contacts].join('\n\n');
        const shareActionId = `${constants.ACTION_SHARE_DETAILS}${JSON.stringify({ name, description })}`;
        console.log('TCL: onGetServiceDetails -> actionId', actionId);
        const buttons = [UI.button(shareActionId, constants.buttons.SHARE_DETAILS)];
        app.sendTargetedMessage(userId, annotation, UI.generic(name, body, buttons));
    }).catch(() => serviceNotFound(name, message, annotation));
}

const onShareServiceDetails = (message, annotation) => {
    const { actionId = '' } = annotation;
    console.log('TCL: onShareServiceDetails -> actionId', actionId);
    const { name, description } = JSON.parse(strings.chompLeft(actionId, constants.ACTION_SHARE_DETAILS));
    API.getService(description).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }
        const { people } = _.first(services);
        const { userId, spaceId } = message;
        const contacts = _.map(people, ({ id, displayName }) => `<@${id}|${strings.titleCase(displayName)}>`).join('\n');
        const data = `${description}\n\n${contacts}`;
        app.sendMessage(spaceId, data);
        app.sendTargetedMessage(userId, annotation, UI.generic(description, constants.SERVICE_SHARED));
    }).catch(() => serviceNotFound(name, message, annotation));
};

const onActionSelected = (message, annotation) => {
    const { actionId = '' } = annotation;
    switch(true) {
        case actionId.startsWith(constants.ACTION_GET_DETAILS):
            return onGetServiceDetails(message, annotation);
        case actionId.startsWith(constants.ACTION_SHARE_DETAILS):
            return onShareServiceDetails(message, annotation);
        default:
            return;
    }
}

app.on('actionSelected:/service', getService);

app.on('actionSelected', onActionSelected);
