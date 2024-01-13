/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // remove
  collection.schema.removeField("fsfvetys")

  return dao.saveCollection(collection)
})
