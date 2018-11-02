const _ = require('underscore');
const Q = require('q');

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
    console.error(`[ERROR] "${title}"`, error);
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

    API.getServiceById(serviceId).then(services => {
        const { name, people, repo } = _.first(services);
        const link = `- ${Constants.GIT_REPO}/${repo}`
        const contacts =  People.getMentions(people);
        const body = [`Repo:\n${link}`, `Contacts:\n${contacts}`].join('\n\n');
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

    API.getServiceById(serviceId).then(services => {
        const { name, description, people } = _.first(services);
        const { userId, spaceId } = message;
        const contacts = People.getMentions(people);
        const repoDetails = _.map(name.split(' '), repo => `[${repo}](${Constants.GIT_REPO}/${repo})`).join('\n');
        const text = `\n${repoDetails}\n\nContacts:\n${contacts}`;
        sendGenericAnnotation(spaceId, description, text, Constants.PIPELINE_SERVICE);
        app.sendTargetedMessage(userId, annotation, UI.generic(description, Constants.SERVICE_SHARED));
    }).catch(err => {
        sendNotFound(err, Constants.SERVICE_NOT_FOUND, name, message, annotation);
    });
};

const onShareTeamDetails = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [teamId, teamName, repositoryName] = Actions.getActionData(actionId, Constants.ACTION_SHARE_TEAM_COMMITTERS);

    API.getTeam(teamId).then(team => {
        const { userId, spaceId } = message;
        const { name: teamName, members } = team;

        return API.getPeople(app, members).then(people => {
            const contacts = People.getMentions(people);
            const text = `\nTeam: *${teamName}*\n\nCommitters:\n${contacts}`;
            sendGenericAnnotation(spaceId, repositoryName, text, Constants.GIT_REPOSITORY);
            const title = Strings.titleCase(`${repositoryName} - ${teamName}`);
            app.sendTargetedMessage(userId, annotation, UI.generic(title, Constants.COMMITTERS_SHARED));
        });
    }).catch(err => {
        sendNotFound(err, Constants.COMMITTERS_NOT_FOUND, teamName, message, annotation);
    });
}

const onViewCommitters = (message, annotation) => {
    const { actionId = '' } = annotation;
    const [teamId, teamName, repositoryName] = Actions.getActionData(actionId, Constants.ACTION_VIEW_COMMITTERS);

    API.getTeam(teamId).then(team => {
        const { userId } = message;
        const { name: teamName, members } = team;
        return API.getPeople(app, members).then(people => {
            const contacts = People.getContacts(people);
            const shareActionId = Actions.getActionId(Constants.ACTION_SHARE_TEAM_COMMITTERS, [teamId, teamName, repositoryName]);
            const title = `Repository: ${Strings.titleCase(repositoryName)}`
            const text = `Team: *${Strings.titleCase(teamName)}*\n\nCommitters:\n${contacts}`;
            const buttons = [UI.button(shareActionId, Constants.buttons.SHARE_DETAILS)];
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

const onGetServiceCommitters = (message, annotation) => {
    onFocusAction(message, annotation, findCommitters);
}

const onGetPipelineContacts = (message, annotation) => {
    onFocusAction(message, annotation, findService);
}

const onFocusAction = (message, annotation, doService) => {
    const { referralMessageId } = annotation;
    return app.getMessage(referralMessageId, ['annotations']).then(({ annotations = [] }) => {
        _.chain(annotations)
            .where(({ type: Constants.focus.TYPE }))
            .map(({ payload }) => {
                doService(message, annotation, [JSON.parse(payload)]);
            });
    }).catch(err => {
        sendNotFound(err, Constants.REPOSITORY_NOT_FOUND, 'Repository', message, annotation);
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
       case actionId.startsWith(Constants.focus.actions.SERVICE_COMMITTERS):
            return onGetServiceCommitters(message, annotation);
        case actionId.startsWith(Constants.focus.actions.PIPELINE_CONTACTS):
            return onGetPipelineContacts(message, annotation);
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

const addFocus = (message, word, data, action, key) => {
    const { content } = message;
    const { focus: { CATEGORY, LENS } } = Constants;
    _.each(data, ({ [key]: repo }) => {
        if (_.isEqual(word.toLocaleLowerCase(), repo.toLocaleLowerCase())) {
            app.addMessageFocus(message, word, LENS, CATEGORY, action, word);
        }

        // const name = Strings.humanize(repo).toLocaleLowerCase();
        // if(content.toLocaleLowerCase().includes(name)) {
        //     app.addMessageFocus(message, name, LENS, CATEGORY, action, repo);
        // }
    });
}

const onMessageCreated =  message => {
    if (message.spaceId !== '5aaec3d1e4b0a629ce7c92b4') {
        return;
    }
    const { content = '' } = message;
    if (_.isEmpty(content)) {
        return;
    }

    Q.allSettled([API.getServices(), API.getRepositories()]).then(([{ value: services }, { value: repositories }]) => {
        const words = content.toLocaleLowerCase().split(' ');
        _.each(words, word => {
            const { focus: { COMMITTERS_ACTION, PIPELINE_ACTION } } = Constants;
            addFocus(message, word, services, PIPELINE_ACTION, 'repo');
            addFocus(message, word, repositories, COMMITTERS_ACTION, 'name');
        });
    }).catch(err => {
        console.log('[ERROR] onMessageCreated - Add Focus Annotation', err);
    });
}

app.on('actionSelected:/service', findService);

app.on('actionSelected:/committers', findCommitters);

app.on('actionSelected', onActionSelected);

app.on('message-created', onMessageCreated);