// const metaDataService = require("../src/meta-data/meta-data.service");

(async () => {
  try {
    // const metaData = await metaDataService.getMetaData();
    // if (metaData.ex) throw metaData.ex;
    // if (!metaData.data) {
    //   console.log(`MetaData is not seeded`);
    //   console.log(`to seed data, run command: npm run seed-db:meta-data`);
    //   process.exit(-1);
    // }
  } catch (ex) {
    console.log(ex);
    process.exit(-1);
  }
})();
