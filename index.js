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
        console.log('TCL: getService -> services', services);
        serviceNotFound(serviceName + "_TEST", spaceId);
    }).then(err => {
        console.log('TCL: getService -> err', err);
        serviceNotFound(serviceName, spaceId);
    })
};

app.on('actionSelected:/service', getService);
