const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka1:29092", "kafka2:29092", "kafka3:29092"],
  // brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
});

const connectAdmin = async () => {
  const admin = kafka.admin();
  await admin.connect();
  return admin;
};

const disconnectAdmin = async (admin) => {
  await admin.disconnect();
};

exports.checkKafka = async () => {
  try {
    const admin = await connectAdmin();
    console.log("Kafka is running");
    await disconnectAdmin(admin);
    return true;
  } catch (error) {
    console.error("Kafka is not running");
    return false;
  }
};

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

exports.runProducer = async (topic, message) => {
  try {
    await producer.connect();
    const resp = await producer.send({
      topic: topic,
      messages: [message],
    });
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error producing message:", error);
    throw error;
  }
};

exports.disconnectProducer = async () => {
  try {
    console.log("Disconnecting producer...");
    await producer.disconnect();
    console.log("Producer disconnected.");
  } catch (error) {
    console.error("Error disconnecting producer:", error);
  }
};

const consumer = kafka.consumer({
  groupId: "test-group",
});

const addTopicToSubscription = async (topic) => {
  try {
    await consumer.stop();
    await consumer.connect();
    await consumer.subscribe({ topic });
    console.log("Added topic to subscription:", topic);
  } catch (error) {
    console.error("Error adding topic to subscription:", error);
    throw error;
  } finally {
    await consumer.disconnect();
  }
};

exports.runConsumer = async () => {
  try {
    await consumer.connect();
    const admin = await connectAdmin();
    const topics = await admin.listTopics();
    const filteredTopics = await Promise.all(
      topics
        .filter(
          (topic) =>
            topic && typeof topic === "string" && !topic.startsWith("__")
        )
        .map(async (topic) => {
          return topic;
        })
    );

    await Promise.all(
      filteredTopics.map((topic) =>
        consumer.subscribe({ topic, fromBeginning: true })
      )
    );
    // await consumer.run({
    //   eachMessage: async ({ topic, partition, message }) => {
    //     console.log("--------------------------------------");
    //     console.log("Received message", {
    //       topic,
    //       partition,
    //       value: message.value.toString(),
    //     });
    //   },
    // });
  } catch (error) {
    console.error("Error running consumer:", error);
    throw error;
  }
};

exports.createTopic = async (topic) => {
  try {
    const admin = await connectAdmin();
    await admin.createTopics({
      topics: [{ topic: topic, numPartitions: 2 }],
    });
    console.log(topic, "Topic created successfully");
    await addTopicToSubscription(topic);
    await disconnectAdmin(admin);
  } catch (error) {
    console.error("Error creating topic:", error);
    throw error;
  }
};

exports.getRunningTopics = async () => {
  try {
    const admin = await connectAdmin();
    const topics = await admin.listTopics();
    const filteredTopics = await Promise.all(
      topics
        .filter(
          (topic) =>
            topic && typeof topic === "string" && !topic.startsWith("__")
        )
        .map(async (topic) => {
          return topic;
        })
    );
    await disconnectAdmin(admin);
    return filteredTopics;
  } catch (error) {
    console.error("Error getting running topics:", error);
    throw error;
  }
};

exports.returnMessageFromSpecificTopic = async (topic) => {
  try {
    let messages = [];
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messages.push(message.value.toString());
      },
    });
    await consumer.disconnect();
    return messages;
  } catch (error) {
    console.error("Error running consumer:", error);
    throw error;
  }
};

exports.returnMessagesFromAllTopics = async () => {
  try {
    let messages = [];
    await consumer.connect();
    const admin = await connectAdmin();
    const topics = await admin.listTopics();
    const filteredTopics = await Promise.all(
      topics
        .filter(
          (topic) =>
            topic && typeof topic === "string" && !topic.startsWith("__")
        )
        .map(async (topic) => {
          return topic;
        })
    );
    await Promise.all(
      filteredTopics.map((topic) =>
        consumer.subscribe({ topic, fromBeginning: true })
      )
    );
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messages.push({ topic, message: message.value.toString() });
      },
    });
    await consumer.disconnect();
    await disconnectAdmin(admin);
    return messages;
  } catch (error) {
    console.error("Error running consumer:", error);
    throw error;
  }
};

exports.deleteTopic = async (topic) => {
  try {
    const admin = await connectAdmin();
    await admin.deleteTopics({
      topics: [topic],
    });
    console.log(topic, "Topic deleted successfully");
    await disconnectAdmin(admin);
    return true;
  } catch (error) {
    console.error("Error deleting topic:", error);
    return false;
  }
};

exports.deleteAllTopics = async () => {
  try {
    const admin = await connectAdmin();
    const topics = await admin.listTopics();
    const filteredTopics = await Promise.all(
      topics
        .filter(
          (topic) =>
            topic && typeof topic === "string" && !topic.startsWith("__")
        )
        .map(async (topic) => {
          return topic;
        })
    );
    await admin.deleteTopics({
      topics: filteredTopics,
    });
    console.log("All topics deleted successfully");
    await disconnectAdmin(admin);
    return true;
  } catch (error) {
    console.error("Error deleting topics:", error);
    return false;
  }
};

exports.deleteMessagesFromTopic = async (topic) => {
  try {
    let messages = [];
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messages.push(message);
      },
    });
    await consumer.disconnect();
    return messages;
  } catch (error) {
    console.error("Error running consumer:", error);
    throw error;
  }
};

exports.deleteAllMessagesFromAllTopics = async () => {
  try {
    let messages = [];
    await consumer.connect();
    const admin = await connectAdmin();
    const topics = await admin.listTopics();
    const filteredTopics = await Promise.all(
      topics
        .filter(
          (topic) =>
            topic && typeof topic === "string" && !topic.startsWith("__")
        )
        .map(async (topic) => {
          return topic;
        })
    );
    await Promise.all(
      filteredTopics.map((topic) =>
        consumer.subscribe({ topic, fromBeginning: true })
      )
    );
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messages.push({ topic, message });
      },
    });
    await consumer.disconnect();
    await disconnectAdmin(admin);
    return messages;
  } catch (error) {
    console.error("Error running consumer:", error);
    throw error;
  }
};
