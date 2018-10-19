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
    console.log('TCL: getCard data', data);
    const { name = '', description: title, people = [] } = data;
    const subTitle = `${people.length} contact${people.length == 1 ? '' : 's'}`;
    const actionId = `${constants.ACTION_DETAILS}${JSON.stringify({ name })}`;
    const date = (_.now() - 60000);
    return UI.card(title, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
};

const getCards = services => _.chain(services).sort('description').map(getCard).value();

const postCards = (message, annotation, services) => {
    console.log('TCL: postCards -> services', services);
    app.sendTargetedMessage(message.userId, annotation, getCards(services));
};

const serviceNotFound = (serviceName, message, annotation) => {
    const { userId } = message;
    app.sendTargetedMessage(userId, annotation, UI.generic(constants.SERVICE_NOT_FOUND, `${serviceName} - not found.`))
}

const getService = (message, annotation, params) => {
    const { spaceId } = message;
    const serviceName = _.first(params);
    console.log('TCL: getService -> serviceName', serviceName, spaceId);
    API.getService(serviceName).then(services => {
        console.log('TCL: API.getService -> services', services);
        if (services.length) {
            return postCards(message, annotation, services);
        }
        throw new Error('Service Not found');
    }).catch(err => {
        console.log('TCL: getService -> err', err, serviceName);
        serviceNotFound(serviceName, message, annotation);
    })
};

app.on('actionSelected:/service', getService);
