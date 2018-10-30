const getTeams = () => `query {
  organization(login:"toscana"){
    teams(first:100){
      nodes {
        id
        name
        updatedAt
        url
        members(first: 100) {
          nodes {
            id
            email
            name
            url
          }
        }
        repositories(first:100){
          nodes {
            id
            name
            url
            updatedAt
          }
        }
      }
    }
  }
}`;

const getPeople = (app, people) =>  {
  let queryList = _.map(people, ({ email }, index) => {
    return `query${index}: {
      person(email: "${email}") {
        id
        email
        displayName
      }
    }`;
  });
  return app.sendGraphql(`query {${queryList}}`);
}

module.exports = {
  getPeople,
  getTeams
}