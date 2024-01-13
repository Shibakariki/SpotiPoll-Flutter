/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "uc6tsksbrlju2kb",
    "created": "2023-08-05 16:16:21.349Z",
    "updated": "2023-08-05 16:16:21.349Z",
    "name": "Log",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "cdrvvk9b",
        "name": "type",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "kwaim96n",
        "name": "message",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
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
  const collection = dao.findCollectionByNameOrId("uc6tsksbrlju2kb");

  return dao.deleteCollection(collection);
})
