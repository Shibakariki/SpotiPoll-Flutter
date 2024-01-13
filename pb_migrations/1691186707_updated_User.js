/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yiypex51iso8jkx")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yiypex51iso8jkx")

  // remove
  collection.schema.removeField("gdic1wtq")

  return dao.saveCollection(collection)
})
