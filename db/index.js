const Cloudant = require('cloudant');
const constants = require('../js/constants');

const { env: { CLOUDANT_URL, CLOUDANT_DB, VCAP_SERVICES } } = process;

let cloudant = null;
let cloudantDB = null;

const db = {
    docs: {
        store: {},
        hasDoc: key => !!db.docs.store[key],
        getDoc: key => db.docs.store[key],
        setDoc: (key, doc) => {
            db.docs.store[key] = doc;
            return db.docs.store[key];
        },
    },
    getCloudant: () => {
        if (!cloudant) {
            cloudant = Cloudant({ vcapServices: JSON.parse(VCAP_SERVICES), plugins: 'promises' });
        }
        return cloudant;
    },
    getDB: () => {
        if (!cloudantDB) {
            cloudantDB = db.getCloudant().db.use(CLOUDANT_DB);
        }
        return cloudantDB;
    },
    getDOC: key => {
        console.log('getDOC key', key);
        return new Promise((resolve, reject) => {
            const doc = db.docs.getDoc(key);
            if (doc) {
                resolve(doc);
            } else {
                db.getDB().get(key, (err, data) => {
                    if (err) {
                        reject(err, data);
                    } else {
                        resolve(db.docs.setDoc(key, data));
                    }
                });
            }
        })
    },
    updateDOC: (key, data) => {
        console.log('updateDOC: key, data', key, data);
        return db.getDOC(key).then(doc => {
            const newDoc = { ...doc, ...data };
            return db.getDB().insert(newDoc, (err, data) => {
            console.log('DB INSERT: err, data', err, data);
                if (data && data.rev) {
                    newDoc._rev = data.rev;
                }
                if (err) {
                    newDoc = doc;
                    console.log('DB INSERT ERROR', err);
                } else {
                    console.log('DB INSERT OK');
                }
                return db.docs.setDoc(key, newDoc);
            });
        });
    }
}

module.exports = db;