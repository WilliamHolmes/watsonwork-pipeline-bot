const Cloudant = require('cloudant');
const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const UI = require('watsonworkspace-sdk').UI;

const API = require('./api');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const sendAnnotaion = (spaceId, url) => {
    app.sendMessage(spaceId, {
        actor: { name: '! Warning !' },
        color: constants.COLOR_ERROR,
        text: `[${url}](${url})\n*♫♩ Never Gonna Give You Up!*`,
        title: '',
        type: 'generic',
        version: '1'
    });
}

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
    API.getService(serviceName).then(services => {
        serviceNotFound(serviceName + "_TEST", spaceId);
    }).then(err => {
        serviceNotFound(serviceName, spaceId);
    })
};

app.on('actionSelected:/service', getService);
