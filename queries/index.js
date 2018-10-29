const query = `query {
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

module.exports = query;