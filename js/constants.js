const _ = require('underscore');

const ID = _.now();

const constants = {
    ACTION_DETAILS: `${ID}-pipeline-service-details|`,
    buttons: {
        SERVICE_DETAILS: 'Get Service Details'
    },
    COLOR_ERROR: '#C12228',
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