const _ = require('underscore');

const strings = require('./strings');

const people = {
    mention: ({ id, displayName }) => `- <@${id}|${strings.titleCase(displayName)}>`,
    contact: ({ displayName, email }) => `- *${strings.titleCase(displayName)}* (${email})`,
    getMentions: data => people.render(data, people.mention),
    getContacts: data => people.render(data, people.contact),
    render: (data, renderer) => {
        return _.chain(data)
        .compact()
        .sortBy('displayName')
        .map(renderer)
        .value()
        .join('\n')
    }
}

module.exports = people;