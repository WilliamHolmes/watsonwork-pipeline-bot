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

const getActionId = (key, data) => {
    return `${key}${data.join(constants.SPLITTER)}`;
}

const getActionData = (id, actionId) => {
    return strings.chompLeft(id, actionId).split(constants.SPLITTER);
}

const getPlural = (text, data) => {
    return `${data.length} ${text}${data.length === 1 ? '' : 's'}`;
}

const serviceCard = data => {
    const { id, name = '', description, people = [] } = data;
    const subTitle = getPlural('contact', people);
    const actionId = getActionId(constants.ACTION_GET_DETAILS, [id]);
    const date = (_.now() - 60000);
    return UI.card(description, subTitle, name, [UI.cardButton(constants.buttons.SERVICE_DETAILS, actionId)], date);
}

const repositoryCard = data => {
    const { id, name, url, updatedAt } = data;
    const subTitle = constants.LAST_UPDATED;
    const actionId = getActionId(constants.ACTION_GET_COMMITTERS, [id, name]);
    const date = new Date(updatedAt).getTime();
    return UI.card(name, subTitle, url, [UI.cardButton(constants.buttons.GET_COMMITTERS, actionId)], date);
}

const teamCard = (data, repositoryName) => {
    const { id, members, name, updatedAt } = data;
    const subTitle = constants.LAST_UPDATED;
    const actionId = getActionId(constants.ACTION_VIEW_COMMITTERS, [id, name, repositoryName]);
    const date = new Date(updatedAt).getTime();
    const body = getPlural('committer', members);
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

const teamsFound = (message, annotation, data) => {
    const { repositoryName, teams } = data;
    app.sendTargetedMessage(message.userId, annotation, getCards(teams, 'name', card => teamCard(card, repositoryName)));
}

const getContacts = people => {
    return _.chain(people)
        .compact()
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
    const [serviceId] = getActionData(actionId, constants.ACTION_GET_DETAILS);

    API.getServiceById(serviceId).then(services => {
        const { name, people, repo } = _.first(services);
        const link = `- ${constants.GIT_REPO}/${repo}`
        const contacts =  getContacts(people);
        const body = [`repo:\n${link}`, `contacts:\n${contacts}`].join('\n\n');
        const shareActionId = getActionId(constants.ACTION_SHARE_DETAILS, [serviceId]);
        const buttons = [UI.button(shareActionId, constants.buttons.SHARE_DETAILS)];
        app.sendTargetedMessage(userId, annotation, UI.generic(name, body, buttons));

    }).catch(err => {
        serviceNotFound(name, message, annotation);
    });
}

const sendGenericAnnotation = (spaceId, title = '', text = '', name = '') =>  {
    app.sendMessage(spaceId, _.extend({ title, text, actor: { name } }, constants.annotations.GENERIC));
}

const onShareServiceDetails = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [serviceId] = getActionData(actionId, constants.ACTION_SHARE_DETAILS);

    API.getServiceById(serviceId).then(services => {
        const { name, description, people } = _.first(services);
        const { userId, spaceId } = message;
        const contacts = getContacts(people);
        const repoDetails = getRepositories(name);
        const text = `\n${repoDetails}\n\ncontacts:\n${contacts}`;

        sendGenericAnnotation(spaceId, description, text, constants.SERVICE);
        app.sendTargetedMessage(userId, annotation, UI.generic(description, constants.SERVICE_SHARED));

    }).catch(err => {
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
    const [teamId, teamName, repositoryName] = getActionData(actionId, constants.ACTION_VIEW_COMMITTERS);

    API.getTeam(teamId).then(team => {

        //const { userId, spaceId } = message;
        const { userId } = message;

        const { name: teamName, members } = team;
        return API.getPeople(app, members).then(people => {
            const contacts = getContacts(people);
            // const text = `\nTeam: *${teamName}*\n\nCommitters:\n${contacts}`;
            const text = `Team: *${teamName}*\n\nCommitters:\n${contacts}`;
            // sendGenericAnnotation(spaceId, repositoryName, text, constants.GIT_REPOSITORY);
            const shareActionId = getActionId(constants.ACTION_SHARE_TEAM_COMMITTERS, [teamId, teamName, repositoryName]);
            const buttons = [UI.button(shareActionId, constants.buttons.SHARE_DETAILS)];
            const title = `Repository: ${strings.titleCase(repositoryName)}`
            app.sendTargetedMessage(userId, annotation, UI.generic(title, text, buttons));
        });
    }).catch(err => {
        teamsNotFound(teamName, message, annotation);
    });
}

const onGetCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [repositoryId, repositoryName] = getActionData(actionId, constants.ACTION_GET_COMMITTERS);
    API.getCommitterTeams(repositoryId).then(teams => {
        teamsFound(message, annotation, { repositoryName, teams });
    }).catch(err => {
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
    API.getRepository(repository).then(repositories => {
        repositoryFound(message, annotation, repositories);
    }).catch(err => {
        repositoryNotFound(repository, message, annotation);
    });
}

const findService = (message, annotation, params) => {
    const serviceName = _.first(params);
    API.getService(serviceName).then(services => {
        serviceFound(message, annotation, services);
    }).catch(err => {
        serviceNotFound(serviceName, message, annotation);
    });
}

app.on('actionSelected:/service', findService);

app.on('actionSelected:/committers', findCommitters);

app.on('actionSelected', onActionSelected);
