const string = require('string');

const strings = {
    chompLeft: (str, value) => string(str).chompLeft(value).s,
    substitue: (str, values) => string(str).template(values).s,
    titleCase: str => (str || '').toLowerCase().replace(/(?:^|\s|-|'|’)\S/g, m => m.toUpperCase()),
    endsWith: (str1, str2) => string(str1).endsWith(str2),
    usePlural: (text, data) => `${data.length} ${text}${data.length === 1 ? '' : 's'}`
}

module.exports = strings;