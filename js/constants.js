const _ = require('underscore');

const ID = _.now();

const constants = {
    ACTION_ID: `${ID}-pipeline-share|`,
    BUTTON_SHARE: 'Share With Space',
    COLOR_ERROR: '#C98AF7',
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