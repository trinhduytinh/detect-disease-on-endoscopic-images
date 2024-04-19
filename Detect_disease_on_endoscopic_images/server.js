const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path : './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(process.env.DATABASE_LOCAL)
    .then(() => console.log('DB connection successful!'));

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`App listening on port ${port}...`);
});
