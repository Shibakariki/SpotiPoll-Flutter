/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("yiypex51iso8jkx");

  return dao.deleteCollection(collection);
}, (db) => {
  const collection = new Collection({
    "id": "yiypex51iso8jkx",
    "created": "2023-08-04 21:52:14.919Z",
    "updated": "2023-08-11 13:58:17.839Z",
    "name": "User",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "xs7ysqiu",
        "name": "username",
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
        "id": "gdic1wtq",
        "name": "id_user",
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
})
