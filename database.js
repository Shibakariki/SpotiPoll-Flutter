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
    try {
      await this._checkAuthentication();

        const data = {
          "id_track": track.id,
          "name": track.name,
          "artist": track.artist,
          "adder": track.adder,
          "url": track.url,
        };

        const addedTrack = await this.pb.collection('Track').create(data);

        return addedTrack;
      
    } catch (error) {
      if (error.status !== 400) {
        console.error('An error occurred while adding the track:', error);
      }
    }
  }  

  async deleteTrack(trackId) {
    await this._checkAuthentication();
    const deletedRecord = await this.pb.collection('Track').delete(trackId);
    return deletedRecord;
  }
}
