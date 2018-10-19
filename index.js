const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const UI = require('watsonworkspace-sdk').UI;

const constants = require('./js/constants');
const API = require('./api');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const getCard = data => {
    const { name = '', description, people = [] } = data;
    const subTitle = `${people.length} contact${people.length == 1 ? '' : 's'}`;
    const actionId = `${constants.ACTION_DETAILS}${JSON.stringify({ name, description })}`;
    const date = (_.now() - 60000);
    return UI.card(description, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
};

const getCards = services => _.chain(services).sort('description').map(getCard).value();

const postCards = (message, annotation, services) => {
    app.sendTargetedMessage(message.userId, annotation, getCards(services));
};

const serviceNotFound = (serviceName, message, annotation) => {
    const { userId } = message;
    app.sendTargetedMessage(userId, annotation, UI.generic(constants.SERVICE_NOT_FOUND, `${serviceName} - not found.`))
}

const getService = (message, annotation, params) => {
    const { spaceId } = message;
    const serviceName = _.first(params);
    API.getService(serviceName).then(services => {
        if (services.length) {
            return postCards(message, annotation, services);
        }
        throw new Error('Service Not found');
    }).catch(err => {
        serviceNotFound(serviceName, message, annotation);
    })
};

const onActionSelected = (message, annotation) => {
    const { userId } = message;
    const { actionId = '' } = annotation;
    if (actionId.startsWith(constants.ACTION_DETAILS)) {
        const { description } = JSON.parse(actionId.split(constants.ACTION_DETAILS)[1]);
        API.getService(description).then(services => {
            if (services.length) {
                const { name, people, repo } = _.first(services);
                const link = `${constants.GIT_REPO}/${repo}`
                const contacts = _.map(people, ({ id, displayName }) => `<@${id}|${displayName}>`).join('\n');
                const body = [link, contacts].join('\n\n\n');
                app.sendTargetedMessage(userId, annotation, UI.generic(name, body))
            }
            throw new Error('Service Not found');
        }).catch(err => {
            serviceNotFound(name, message, annotation);
        })
    }
}

app.on('actionSelected:/service', getService);

app.on('actionSelected', onActionSelected);
