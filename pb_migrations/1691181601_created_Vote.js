/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "8q7o99n7z54u6yq",
    "created": "2023-08-04 20:40:01.989Z",
    "updated": "2023-08-04 20:40:01.989Z",
    "name": "Vote",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fsfvetys",
        "name": "vote_time",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "rp7loiyu",
        "name": "vote_answer",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      },
      {
        "system": false,
        "id": "fuan9u1h",
        "name": "user_id",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "8nqzkait",
        "name": "track_id",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "scfb3e7xghreu19",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq");

  return dao.deleteCollection(collection);
})
