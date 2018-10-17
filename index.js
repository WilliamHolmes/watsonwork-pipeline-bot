const Cloudant = require('cloudant');
const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const UI = require('watsonworkspace-sdk').UI;

const API = require('./api');

const constants = require('./js/constants');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

// const sendAnnotaion = (spaceId, url) => {
//     console.log('CONFIRMED RICKROLL', url);
//     app.sendMessage(spaceId, {
//         actor: { name: '! Warning !' },
//         color: constants.COLOR_ERROR,
//         text: `[${url}](${url})\n*♫♩ Never Gonna Give You Up!*`,
//         title: '',
//         type: 'generic',
//         version: '1'
//     });
// }

app.on('message-created', (message, annotation) => {
    const { content = '', spaceId } = message;
    console.log('MESSAGE CREATED', spaceId, content);
});
