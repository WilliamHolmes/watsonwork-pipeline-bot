const constants = {
    SPLITTER: '|',
    PIPELINE_SERVICE: 'Pipeline Service',
    COMMITTER_TEAMS: 'Committer Teams',
    GIT_TEAMS: 'GIT Team',
    GIT_REPOSITORY: 'GIT Repository',
    COMMITTERS_GROUP: '-committers',
    GIT_REPO: 'https://github.ibm.com/toscana',
    GIT_GQL: 'https://github.ibm.com/api/graphql',
    SERVICE_NOT_FOUND: '404 - Service Not Found',
    REPOSITORY_NOT_FOUND: '404 - Repository Not Found',
    COMMITTERS_NOT_FOUND: '404 - Committer Teams Not Found',
    search: {
        REPOSITORY_KEYS: ['name'],
        SERVICE_KEYS: ['description', 'name', 'repo'],
        OPTIONS: { caseSensitive: false, sort: true }
    },
    ACTION_GET_DETAILS: 'workspace-pipeline-helper-get-service|',
    ACTION_GET_COMMITTERS: 'workspace-pipeline-helper-get-committers|',
    ACTION_SHARE_DETAILS: 'workspace-pipeline-helper-share-service|',
    ACTION_SHARE_TEAM_COMMITTERS: 'workspace-pipeline-helper-share-committers|',
    ACTION_VIEW_COMMITTERS: 'workspace-pipeline-helper-view-committers|',
    SERVICE_SHARED: 'Service - Shared With Space',
    COMMITTERS_SHARED: 'Committers - Shared With Space',
    LAST_UPDATED: 'Last Updated',
    buttons: {
        SERVICE_DETAILS: 'Get Service Details',
        GET_COMMITTERS: 'Get Committer Teams',
        GET_TEAM_MEMBERS: 'Get Team Members',
        VIEW_COMMITTERS: 'View Committers',
        SHARE_DETAILS: 'Share with Space'
    },
    annotations: {
        GENERIC: { type: 'generic', version: '1', color: '#C12228' }
    },
    db: {
        NAME: 'pipeline',
        DOCS: {
            SERVICES: 'services',
            PEOPLE: 'people',
            TEAMS: 'teams'
        },
        keys: {
            SERVICES: 'services',
            DESCRIPTION: 'description',
            NAME: 'name',
            PEOPLE: 'people',
            TEAMS: 'teams'
        }
    }
}

module.exports = constants;