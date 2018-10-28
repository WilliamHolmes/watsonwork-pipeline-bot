const query = `query {
  organization(login:"toscana"){
    teams(first:100){
      nodes {
        id
        name
        updatedAt
        members(first: 100) {
          nodes {
            id
            email
            name
          }
        }
        repositories(first:100){
          nodes {
            id
            name
            projectsUrl
            updatedAt
          }
        }
      }
    }
  }
}`;

module.exports = query;