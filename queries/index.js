const query = `query {
  organization(login:"toscana"){
    teams(first:100){
      nodes {
        id
        name
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
          }
        }
      }
    }
  }
}`;

module.exports = query;