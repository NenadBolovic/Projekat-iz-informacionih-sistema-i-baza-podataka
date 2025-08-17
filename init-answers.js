db = db.getSiblingDB(process.env.MONGO_ANSWERS_DB);
if (!db.getUser(process.env.MONGO_ANSWERS_USER)) {
  db.createUser({
    user: process.env.MONGO_ANSWERS_USER,
    pwd: process.env.MONGO_ANSWERS_PASSWORD,
    roles: [
      {
        role: "readWrite",
        db: process.env.MONGO_ANSWERS_DB
      }
    ]
  });
}


/*db = db.getSiblingDB('answersdatabase');
if (!db.getUser('answers_user')) {
  db.createUser({
    user: "answers_user",
    pwd: "password_answers",
    roles: [
      {
        role: "readWrite",
        db: "answersdatabase"
      }
    ]
  });
}*/