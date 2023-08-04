import { ClientResponseError } from "pocketbase";
import PocketBase from "pocketbase/cjs";

export default class Database {
  constructor() {
    this.pb = new PocketBase('http://127.0.0.1:8090');
    this.username = process.env.PB_USERNAME;
    this.password = process.env.PB_PASSWORD;
  }

  async _checkAuthentication() {
    if (!this.pb.authStore.isValid) {
      const authData = await this.pb.admins.authWithPassword(this.username, this.password);
    }
  }

  async getTrackList() {
    await this._checkAuthentication();
    const records = await this.pb.collection('Track').getFullList({
        sort: '-created',
    });
    return records;
  }

  async addTrack(track) {
    await this._checkAuthentication();

    console.log(track);
    console.log(track.name);

    const data = {
      "id_track": track.id,
      "name": track.name,
      "artist": track.artist,
      "adder": track.adder,
      "url": track.url,
  };
  
  
    const addedTrack = await this.pb.collection('Track').create(data);
    
    return addedTrack;
  }
  

  async deleteTrack(trackId) {
    await this._checkAuthentication();
    const deletedRecord = await this.pb.collection('Track').delete(trackId);
    return deletedRecord;
  }
}
