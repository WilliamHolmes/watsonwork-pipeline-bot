const query = `query {
  organization(login:"toscana"){
    teams(first:100){
      nodes{
        name
        members(first: 100) {
          nodes {
            email
            name
          }
        }
        repositories(first:100){
          nodes{
            name
          }
        }
      }
    }
  }
}`

module.exports = query;