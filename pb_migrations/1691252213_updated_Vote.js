/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8q7o99n7z54u6yq")

  // remove
  collection.schema.removeField("rp7loiyu")

  return dao.saveCollection(collection)
})
