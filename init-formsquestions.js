db = db.getSiblingDB(process.env.MONGO_FORMS_DB);
if (!db.getUser(process.env.MONGO_FORMS_USER)) {
  db.createUser({
    user: process.env.MONGO_FORMS_USER,
    pwd: process.env.MONGO_FORMS_PASSWORD,
    roles: [
      {
        role: "readWrite",
        db: process.env.MONGO_FORMS_DB
      }
    ]
  });
}


/*db = db.getSiblingDB('formsquestionsdatabase');
if (!db.getUser('formsquestions_user')) {
  db.createUser({
    user: "formsquestions_user",
    pwd: "password_forms",
    roles: [
      {
        role: "readWrite",
        db: "formsquestionsdatabase"
      }
    ]
  });
}*/