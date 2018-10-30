const _ = require('underscore');

const appFramework = require('watsonworkspace-bot');
appFramework.level('verbose');
appFramework.startServer();
const app = appFramework.create();

const { UI } = require('watsonworkspace-sdk');

const constants = require('./js/constants');
const strings = require('./js/strings');
const API = require('./api');

app.authenticate().then(() => app.uploadPhoto('./appicon.jpg'));

const serviceCard = data => {
    const { id, name = '', description, people = [] } = data;
    const subTitle = `${people.length} contact${people.length === 1 ? '' : 's'}`;
    const actionId = `${constants.ACTION_GET_DETAILS}${id}`;
    const date = (_.now() - 60000);
    return UI.card(description, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
}

const repositoryCard = data => {
    const { id, name, url, updatedAt } = data;
    const subTitle = constants.LAST_UPDATED;
    const actionId = `${constants.ACTION_GET_COMMITTERS}${id}|${name}`;
    const date = new Date(updatedAt).getTime();
    return UI.card(name, subTitle, url, [UI.cardButton(constants.buttons.GET_COMMITTERS, actionId)], date);
}

const teamCard = data => {
    const { id, members, name, updatedAt } = data;
    console.log('TCL: teamCard');
    const subTitle = constants.LAST_UPDATED;
    const actionId = `${constants.ACTION_VIEW_COMMITTERS}${id}|${name}`;
    const date = new Date(updatedAt).getTime();
    const body = `${members.length} committer${members.length === 1 ? '' : 's'}`;
    console.log('TCL: name, subTitle, body', name, subTitle, body);
    return UI.card(name, subTitle, body, [UI.cardButton(constants.buttons.VIEW_COMMITTERS, actionId)], date);
}


const getCards = (data, sortKey, cardType) => _.chain(data).sortBy(sortKey).map(cardType).value();

const serviceNotFound = (serviceName, message, annotation) => {
    app.sendTargetedMessage(message.userId, annotation, UI.generic(constants.SERVICE_NOT_FOUND, `${serviceName} - not found.`));
}

const repositoryNotFound = (repository, message, annotation) => {
    app.sendTargetedMessage(message.userId, annotation, UI.generic(constants.REPOSITORY_NOT_FOUND, `${repository} - not found.`));
}

const teamsNotFound = (committers, message, annotation) => {
    app.sendTargetedMessage(message.userId, annotation, UI.generic(constants.COMMITTERS_NOT_FOUND, `${committers} - not found.`));
}

const serviceFound = (message, annotation, services) => {
    app.sendTargetedMessage(message.userId, annotation, getCards(services, 'description', serviceCard));
}

const repositoryFound = (message, annotation, repositories) => {
    app.sendTargetedMessage(message.userId, annotation, getCards(repositories, 'name', repositoryCard));
}

const teamsFound = (message, annotation, teams) => {
    console.log('TCL: teamsFound');
    app.sendTargetedMessage(message.userId, annotation, getCards(teams, 'name', teamCard));
}

const getContacts = people => {
    return _.chain(people)
        .has('displayName')
        .sortBy('displayName')
        .map(({ id, displayName }) => `- <@${id}|${strings.titleCase(displayName)}>`)
        .value()
        .join('\n')
}

const getRepositories = (data = '') => {
    return _.map(data.split(' '), repo => `[${repo}](${constants.GIT_REPO}/${repo})`).join('\n');
}

const onGetServiceDetails = (message, annotation) => {
    const { userId } = message;
    const { actionId = '' } = annotation;
    const serviceId = strings.chompLeft(actionId, constants.ACTION_GET_DETAILS);
    API.getServiceById(serviceId).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }
        const { name, people, repo } = _.first(services);
        const link = `- ${constants.GIT_REPO}/${repo}`
        const contacts =  getContacts(people);
        const body = [`repo:\n${link}`, `contacts:\n${contacts}`].join('\n\n');
        const shareActionId = `${constants.ACTION_SHARE_DETAILS}${serviceId}`;
        const buttons = [UI.button(shareActionId, constants.buttons.SHARE_DETAILS)];
        app.sendTargetedMessage(userId, annotation, UI.generic(name, body, buttons));
    }).catch(err => {
        console.error('[ERROR] onGetServiceDetails', err);
        serviceNotFound(name, message, annotation);
    });
}

const sendGenericAnnotation = (spaceId, title = '', text = '', name = '') =>  {
    app.sendMessage(spaceId, _.extend({ title, text, actor: { name } }, constants.annotations.GENERIC));
}

const onShareServiceDetails = (message, annotation) => {
    const { actionId = '' } = annotation;
    const serviceId = strings.chompLeft(actionId, constants.ACTION_SHARE_DETAILS);

    API.getServiceById(serviceId).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }

        const { name, description, people } = _.first(services);
        const { userId, spaceId } = message;
        const contacts = getContacts(people);
        const repoDetails = getRepositories(name);
        const text = `\n${repoDetails}\n\ncontacts:\n${contacts}`;

        sendGenericAnnotation(spaceId, description, text, constants.SERVICE);
        app.sendTargetedMessage(userId, annotation, UI.generic(description, constants.SERVICE_SHARED));
    }).catch(err => {
        console.error('[ERROR] onShareServiceDetails', err);
        serviceNotFound(name, message, annotation);
    });
};

const onShareTeamDetails = (message, annotation) => {
    // const { actionId = '' } = annotation;
    // const [teamId, teamName] = strings.chompLeft(actionId, constants.ACTION_SHARE_TEAM_COMMITTERS);
    // API.getTeam(teamId).then(team => {
    //     const { spaceId } = message;
    //     const { name, members } = team;
    //     const text = JSON.stringify(members);
    //     sendGenericAnnotation(spaceId, name, text, constants.REPOSITORY_COMMITTERS);
    // }).catch(err => {
    //     console.error('[ERROR] onGetCommitters', err);
    //     teamsNotFound(teamName, message, annotation);
    // });
}

const onViewCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [teamId, teamName] = strings.chompLeft(actionId, constants.ACTION_VIEW_COMMITTERS).split('|');
    console.log('TCL: onViewCommitters -> teamId, teamName', teamId, teamName);
    API.getTeam(teamId).then(team => {
        console.log('TCL: onViewCommitters -> team', team.name);
        const { spaceId } = message;
        const { name, members, url } = team;
        return API.getPeople(app, members).then(people => {
            console.log('TCL: onViewCommitters API.getPeople -> people', people.length);
            const contacts = getContacts(people);
            const text = `[Members URL](${url}/members)\n\nCommitters:\n${contacts}`;
            sendGenericAnnotation(spaceId, name, text, constants.GIT_REPOSITORY);

            // const buttons = [UI.button(shareActionId, constants.buttons.SHARE_DETAILS)];
            // app.sendTargetedMessage(userId, annotation, UI.generic(name, body, buttons));
        });
    }).catch(err => {
        console.error('[ERROR] onViewCommitters', err);
        teamsNotFound(teamName, message, annotation);
    });
}

const onGetCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [repositoryId, repositoryName] = strings.chompLeft(actionId, constants.ACTION_GET_COMMITTERS).split('|');
    console.log('TCL: onGetCommitters -> repositoryId, repositoryName');
    API.getCommitterTeams(repositoryId).then(teams => {
        console.log('TCL: onGetCommitters');
        if (_.isEmpty(teams)) {
            throw new Error('Committer Teams Not found');
        }
        teamsFound(message, annotation, teams);
    }).catch(err => {
        console.error('[ERROR] onGetCommitters', err);
        teamsNotFound(repositoryName, message, annotation);
    });
}

const onActionSelected = (message, annotation) => {
    const { actionId = '' } = annotation;
    switch(true) {
        case actionId.startsWith(constants.ACTION_GET_DETAILS):
            return onGetServiceDetails(message, annotation);
        case actionId.startsWith(constants.ACTION_SHARE_DETAILS):
            return onShareServiceDetails(message, annotation);
        case actionId.startsWith(constants.ACTION_GET_COMMITTERS):
            return onGetCommitters(message, annotation);
        case actionId.startsWith(constants.ACTION_VIEW_COMMITTERS):
            return onViewCommitters(message, annotation);
        case actionId.startsWith(constants.ACTION_SHARE_TEAM_COMMITTERS):
            return onShareTeamDetails(message, annotation);
        default:
            return;
    }
}

const findCommitters = (message, annotation, params) => {
    const repository = _.first(params);
    console.log('TCL: findCommitters -> repository', repository);
    API.getRepository(repository).then(repositories => {
        if (_.isEmpty(repositories)) {
            throw new Error('Repository Not found');
        }
        repositoryFound(message, annotation, repositories);
    }).catch(err => {
        console.error('[ERROR] findCommitters', err);
        repositoryNotFound(repository, message, annotation);
    });
}

const findService = (message, annotation, params) => {
    const serviceName = _.first(params);
    console.log('TCL: findService -> serviceName', serviceName);
    API.getService(serviceName).then(services => {
        if (_.isEmpty(services)) {
            throw new Error('Service Not found');
        }
        serviceFound(message, annotation, services);
    }).catch(err => {
        console.error('[ERROR] findService', err);
        serviceNotFound(serviceName, message, annotation);
    });
}

app.on('actionSelected:/service', findService);

app.on('actionSelected:/committers', findCommitters);

app.on('actionSelected', onActionSelected);
