const string = require('string');

const strings = {
    chompLeft: (str, value) => string(str).chompLeft(value).s,
    substitue: (str, values) => string(str).template(values).s,
    titleCase: str => (str || '').toLowerCase().replace(/(?:^|\s|-|'|’)\S/g, m => m.toUpperCase()),
}

module.exports = strings;