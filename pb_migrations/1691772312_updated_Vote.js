/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // remove
  collection.schema.removeField("fvkgvgpp")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "o3tcvhzl",
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fvkgvgpp",
    "name": "user_id",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "yiypex51iso8jkx",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  // remove
  collection.schema.removeField("o3tcvhzl")

  return dao.saveCollection(collection)
})
