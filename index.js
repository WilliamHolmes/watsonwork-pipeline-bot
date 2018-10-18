const Cloudant = require('cloudant');
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
    const { name = '', description = '', people = [] } = data;
    const title = 'Toscana Service';
    const subTitle = name;
    const actionId = `${constants.ACTION_ID}${JSON.stringify({ name, people })}`;
    return UI.card(title, subTitle, description, [UI.cardButton(constants.BUTTON_SHARE, actionId), ...buttons]);
};

const getCards = services => _.chain(services).sort('name').map(getCard).value();

const postCards = (message, annotation, services) => {
    console.log('TCL: postCards -> services', services);
    app.sendTargetedMessage(message.userId, annotation, getCards(services));
};

const serviceNotFound = (serviceName, spaceId) => {
    app.sendMessage(spaceId, {
        actor: { name: 'NOT FOUND' },
        color: constants.COLOR_ERROR,
        text: `${serviceName} - not found.`,
        title: '',
        type: 'generic',
        version: '1'
    });
}

const getService = (message, annotation, params) => {
    const { spaceId } = message;
    const serviceName = _.first(params);
    console.log('TCL: getService -> serviceName', serviceName, spaceId);
    API.getService(serviceName).then(services => {
        console.log('TCL: API.getService -> services', services);
        postCards(message, annotation, services);
    }).catch(err => {
        console.log('TCL: getService -> err', err);
        serviceNotFound(serviceName, spaceId);
    })
};

app.on('actionSelected:/service', getService);
