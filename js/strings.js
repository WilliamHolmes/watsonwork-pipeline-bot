const string = require('string');

const strings = {
    chompLeft: (str, value) => string(str).chompLeft(value).s,
    substitue: (str, values) => string(str).template(values).s,
    titleCase: str => (str || '').toLocaleLowerCase().replace(/(?:^|\s|-|'|’)\S/g, m => m.toLocaleUpperCase()),
    endsWith: (str1, str2) => string(str1).endsWith(str2),
    usePlural: (text, data) => `${data.length} ${text}${data.length === 1 ? '' : 's'}`,
    humanize: (str1 = '') => string(str1).humanize().s
}

module.exports = strings;