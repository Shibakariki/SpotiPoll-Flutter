import PocketBase from "pocketbase/cjs";

export default class Database {
  constructor() {
    this.pb = new PocketBase('http://127.0.0.1:8090');
    this.username = process.env.PB_USERNAME;
    this.password = process.env.PB_PASSWORD;
  }

  async _checkAuthentication() {
    if (!this.pb.authStore.isValid) {
      await this.pb.admins.authWithPassword(this.username, this.password);
    }
  }

  async getTrackList() {
    await this._checkAuthentication();
    return await this.pb.collection('Track').getFullList({
      sort: '-created',
    });
  }

  async getTrack(trackId) {
    await this._checkAuthentication();
    return await this.pb.collection('Track').get(trackId);
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

            return await this.pb.collection('Track').create(data);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the track:', error);
            }
        }
    }

    async deleteTrack(trackId) {
        await this._checkAuthentication();
        return await this.pb.collection('Track').delete(trackId);
    }

    async addUser(userId, userName) {
        try {
            await this._checkAuthentication();

            const data = {
                "id_user": userId, "username": userName
            };

            return await this.pb.collection('User').create(data);
        }
        catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the user:', error);
            }
        }
    }

  async getUser(userId) {
    await this._checkAuthentication();
    return await this.pb.collection('User').getFullList({
      sort: '-created',
      filter: 'id_user="'+ userId +'"',
    });
  }

    async getUsersList() {
        await this._checkAuthentication();
        return await this.pb.collection('User').getFullList({
            sort: '-created',
        });
    }

    async deleteUser(userId) {
        await this._checkAuthentication();
        return await this.pb.collection('User').delete(userId);
    }

    async addVote(vote, trackId, userId) {
        try {
            await this._checkAuthentication();

            const data = {
                "vote_answer": vote, "user_id": userId, "track_id": trackId
            };

            return await this.pb.collection('Vote').create(data);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the vote:', error);
            }
        }
    }

    async getVotesList() {
        await this._checkAuthentication();
        return await this.pb.collection('Vote').getFullList({
            sort: '-created',
        });
    }

    async log(type, message) {
        try {
            await this._checkAuthentication();

            const data = {
                "type": type, "message": message
            };

            return await this.pb.collection('Log').create(data);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the vote:', error);
            }
        }
    }
}
