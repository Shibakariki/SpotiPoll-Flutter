/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yiypex51iso8jkx")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "sj9ahskz",
    "name": "is_user",
    "type": "number",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yiypex51iso8jkx")

  // remove
  collection.schema.removeField("sj9ahskz")

  return dao.saveCollection(collection)
})
