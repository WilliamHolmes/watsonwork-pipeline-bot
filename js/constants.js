const _ = require('underscore');

const constants = {
    SERVICE: 'service',
    GIT_REPO: 'https://github.ibm.com/toscana',
    SERVICE_NOT_FOUND: '404 - Service Not Found',
    SEARCH_KEYS: ['description', 'name', 'repo'],
    SEARCH_OPTIONS: { caseSensitive: false, sort: true },
    ACTION_GET_DETAILS: 'workspace-pipeline-helper-get-service|',
    ACTION_SHARE_DETAILS: 'workspace-pipeline-helper-share-service|',
    SERVICE_SHARED: 'Service - Shared With Space',
    buttons: {
        SERVICE_DETAILS: 'Get Service Details',
        SHARE_DETAILS: 'Share with Space'
    },
    annotations: {
        GENERIC: { type: 'generic', version: '1', color: '#C12228' },
    },
    db: {
        NAME: 'pipeline',
        DOCS: {
            SERVICES: 'services',
            PEOPLE: 'people',
        },
        keys: {
            SERVICES: 'services',
            DESCRIPTION: 'description',
            NAME: 'name',
            PEOPLE: 'people',
        }
    }
}

module.exports = constants;