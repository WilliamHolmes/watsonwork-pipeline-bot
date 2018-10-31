const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const { UI } = require('watsonworkspace-sdk');

const API = require('./api');

const Actions = require('./js/actions');
const Cards = require('./js/cards');
const Constants = require('./js/constants');
const People = require('./js/people');
const Strings = require('./js/strings');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const sendNotFound = (error, title, data, message, annotation) => {
    console.error('[ERROR] ${title}', error);
    app.sendTargetedMessage(message.userId, annotation, UI.generic(title, `${data} - not found.`));
}

const serviceFound = (message, annotation, services) => {
    app.sendTargetedMessage(message.userId, annotation, Cards.getCards(services, 'description', Cards.SERVICE));
}

const repositoryFound = (message, annotation, repositories) => {
    app.sendTargetedMessage(message.userId, annotation, Cards.getCards(repositories, 'name', Cards.REPOSITORY));
}

const teamsFound = (message, annotation, data) => {
    const { repositoryName, teams } = data;
    app.sendTargetedMessage(message.userId, annotation, Cards.getCards(teams, 'name', card => Cards.getTeam(card, repositoryName)));
}

const sendGenericAnnotation = (spaceId, title = '', text = '', name = '') =>  {
    app.sendMessage(spaceId, _.extend({ title, text, actor: { name } }, Constants.annotations.GENERIC));
}

const onGetServiceDetails = (message, annotation) => {
    const { userId } = message;
    const { actionId = '' } = annotation;
    const [serviceId] = Actions.getActionData(actionId, Constants.ACTION_GET_DETAILS);
    console.log('TCL: onGetServiceDetails -> serviceId', serviceId);

    API.getServiceById(serviceId).then(services => {
        console.log('TCL: onGetServiceDetails -> services', services.length);
        const { name, people, repo } = _.first(services);
        console.log('TCL: onGetServiceDetails -> people', people.length);
        const link = `- ${Constants.GIT_REPO}/${repo}`
        const contacts =  People.getMentions(people);
        const body = [`repo:\n${link}`, `contacts:\n${contacts}`].join('\n\n');
        const shareActionId = Actions.getActionId(Constants.ACTION_SHARE_DETAILS, [serviceId]);
        const buttons = [UI.button(shareActionId, Constants.buttons.SHARE_DETAILS)];
        app.sendTargetedMessage(userId, annotation, UI.generic(name, body, buttons));
    }).catch(err => {
        sendNotFound(err, Constants.SERVICE_NOT_FOUND, name, message, annotation);
    });
}

const onShareServiceDetails = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [serviceId] = Actions.getActionData(actionId, Constants.ACTION_SHARE_DETAILS);
    console.log('TCL: onShareServiceDetails -> serviceId', serviceId);

    API.getServiceById(serviceId).then(services => {
        const { name, description, people } = _.first(services);
        console.log('TCL: onShareServiceDetails -> people', people.length);
        const { userId, spaceId } = message;
        const contacts = People.getMentions(people);
        const repoDetails = _.map(name.split(' '), repo => `[${repo}](${Constants.GIT_REPO}/${repo})`).join('\n');
        const text = `\n${repoDetails}\n\ncontacts:\n${contacts}`;
        sendGenericAnnotation(spaceId, description, text, Constants.SERVICE);
        app.sendTargetedMessage(userId, annotation, UI.generic(description, Constants.SERVICE_SHARED));
    }).catch(err => {
        sendNotFound(err, Constants.SERVICE_NOT_FOUND, name, message, annotation);
    });
};

const onShareTeamDetails = (message, annotation) => {
    // const { actionId = '' } = annotation;
    // const [teamId, teamName] = Strings.chompLeft(actionId, Constants.ACTION_SHARE_TEAM_COMMITTERS);
    // API.getTeam(teamId).then(team => {
    //     const { spaceId } = message;
    //     const { name, members } = team;
    //     const text = JSON.stringify(members);
    //     sendGenericAnnotation(spaceId, name, text, Constants.REPOSITORY_COMMITTERS);
    // }).catch(err => {
    //     console.error('[ERROR] onGetCommitters', err);
    //     teamsNotFound(teamName, message, annotation);
    // });
}

const onViewCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [teamId, teamName, repositoryName] = Actions.getActionData(actionId, Constants.ACTION_VIEW_COMMITTERS);

    API.getTeam(teamId).then(team => {

        //const { userId, spaceId } = message;
        const { userId } = message;
        const { name: teamName, members } = team;
        return API.getPeople(app, members).then(people => {
            const contacts = People.getContacts(people);
            // const text = `\nTeam: *${teamName}*\n\nCommitters:\n${contacts}`;
            const text = `Team: *${teamName}*\n\nCommitters:\n${contacts}`;
            // sendGenericAnnotation(spaceId, repositoryName, text, Constants.GIT_REPOSITORY);
            const shareActionId = Actions.getActionId(Constants.ACTION_SHARE_TEAM_COMMITTERS, [teamId, teamName, repositoryName]);
            const buttons = [UI.button(shareActionId, Constants.buttons.SHARE_DETAILS)];
            const title = `Repository: ${Strings.titleCase(repositoryName)}`
            app.sendTargetedMessage(userId, annotation, UI.generic(title, text, buttons));
        });
    }).catch(err => {
        sendNotFound(err, Constants.COMMITTERS_NOT_FOUND, teamName, message, annotation);
    });
}

const onGetCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [repositoryId, repositoryName] = Actions.getActionData(actionId, Constants.ACTION_GET_COMMITTERS);
    API.getCommitterTeams(repositoryId).then(teams => {
        teamsFound(message, annotation, { repositoryName, teams });
    }).catch(err => {
        sendNotFound(err, Constants.COMMITTERS_NOT_FOUND, repositoryName, message, annotation);
    });
}

const onActionSelected = (message, annotation) => {
    const { actionId = '' } = annotation;
    switch(true) {
        case actionId.startsWith(Constants.ACTION_GET_DETAILS):
            return onGetServiceDetails(message, annotation);
        case actionId.startsWith(Constants.ACTION_SHARE_DETAILS):
            return onShareServiceDetails(message, annotation);
        case actionId.startsWith(Constants.ACTION_GET_COMMITTERS):
            return onGetCommitters(message, annotation);
        case actionId.startsWith(Constants.ACTION_VIEW_COMMITTERS):
            return onViewCommitters(message, annotation);
        case actionId.startsWith(Constants.ACTION_SHARE_TEAM_COMMITTERS):
            return onShareTeamDetails(message, annotation);
        default:
            return;
    }
}

const findCommitters = (message, annotation, params) => {
    const repository = _.first(params);
    API.getRepository(repository).then(repositories => {
        repositoryFound(message, annotation, repositories);
    }).catch(err => {
        sendNotFound(err, Constants.REPOSITORY_NOT_FOUND, repository, message, annotation);
    });
}

const findService = (message, annotation, params) => {
    const serviceName = _.first(params);
    API.getService(serviceName).then(services => {
        serviceFound(message, annotation, services);
    }).catch(err => {
        sendNotFound(err, Constants.SERVICE_NOT_FOUND, serviceName, message, annotation);
    });
}

app.on('actionSelected:/service', findService);

app.on('actionSelected:/committers', findCommitters);

app.on('actionSelected', onActionSelected);
