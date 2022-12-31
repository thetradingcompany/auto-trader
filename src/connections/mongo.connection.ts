import mongoose from 'mongoose';

const mongoURI =
  'mongodb+srv://autotrader:autotrader2711@autotrader.flawd1f.mongodb.net/daily-metrics?retryWrites=true&w=majority';

// CONNECTION EVENTS
mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  console.log(`Mongoose default connection error: ${err}`);
});

mongoose.set('strictQuery', false);

export async function mongoConnect(): Promise<void> {
  try {
    // const mongoOptions: mongoose.ConnectionOptions = {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   // useFindAndModify: false,
    //   useCreateIndex: true,
    // };

    // await mongoose.connect(mongoURI, mongoOptions);
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to mongodb');
  } catch (error) {
    console.error(`Error in connecting to mongo - ${error}`);
    process.exit(0);
  }
}

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.error('Mongoose default connection disconnected through app termination');
  process.exit(0);
});
