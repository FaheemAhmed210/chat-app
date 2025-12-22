const {
  checkKafka,
  runConsumer,
  disconnectProducer,
} = require("./kafka.service");

exports.initializeKafka = async () => {
  const kafkaStatus = checkKafka();

  kafkaStatus
    ? runConsumer().catch("error", console.error)
    : console.log("Kafka is not running");
};

// Gracefully disconnect Kafka producer when app exits
process.on("SIGINT", async () => {
  console.log("Closing Kafka producer...");
  await disconnectProducer();
  process.exit();
});
