// const mongoose = require("mongoose");
// require("dotenv").config();
// const { Command } = require("commander");

// async function connectDB() {
//   try {
//     await mongoose.connect(process.env.DATABASE_URI);
//     console.log(`Database connected...`);
//   } catch (ex) {
//     console.log(ex);
//     process.exit(-1);
//   }
// }

// const program = new Command();

// program
//   .name("Tomi Analytics Database Seeder")
//   .description("Seed Database")
//   .version("0.1.0");

// program
//   .command("seed-admins")
//   .description("Seed users from csv file")
//   .action(async () => {
//     try {
//       await connectDB();

//       const Admin = require("../src/admins/admins.model");

//       const data = {
//         email: "aaaaa@tomi.com",
//         password: "ssssss",
//       };
//       const users = await Admin.create(data);
//       console.log("Database seeded successfully...", users);
//       process.exit(0);
//     } catch (ex) {
//       console.log(ex);
//       process.exit(1);
//     }
//   });

// program.parse(process.argv);
