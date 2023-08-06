import PocketBase from "pocketbase/cjs";


const handleError = async (action, errorMessage) => {
    try {
        return await action();
    } catch (error) {
        if (error.status !== 400) {
            console.error(errorMessage, error);
        }
        throw error; // Propager l'erreur pour que vous puissiez la gérer à l'extérieur de handleError si nécessaire.
    }
};


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
        return await handleError(async () => {
            await this._checkAuthentication();
            return await this.pb.collection('Track').getFullList({sort: '-created'});
        }, 'An error occurred while retrieving the track list:');
    }

    async getTrack(trackId) {
        return await handleError(async () => {
            await this._checkAuthentication();
            return await this.pb.collection('Track').getFullList({
                sort: '-created', filter: `id_track="${trackId}"`,
            });
        }, 'An error occurred while retrieving the track:');
    }

    async addTrack(track) {
        return await handleError(async () => {
            await this._checkAuthentication();
            return await this.pb.collection('Track').create(track);
        }, 'An error occurred while adding the track:');
    }

    async deleteTrack(trackId) {
        return await handleError(async () => {
            await this._checkAuthentication();
            const ids = await this.getTrack(trackId);
            for (const track of ids) {
                console.log(track.id);
                await this.pb.collection('Track').delete(track.id);
            }
        }, 'An error occurred while deleting the track:');
    }

    async addUser(userId, userName) {
        return await handleError(async () => {
            await this._checkAuthentication();
            const data = {
                "id_user": userId, "username": userName
            };
            return await this.pb.collection('User').create(data);
        }, 'An error occurred while adding the user:');
    }

    async getUser(userId) {
        return await handleError(async () => {
            await this._checkAuthentication();
            return await this.pb.collection('User').getFullList({
                sort: '-created', filter: `id_user="${userId}"`,
            });
        }, 'An error occurred while retrieving the user:');
    }

    async getUsersList() {
        return await handleError(async () => {
            await this._checkAuthentication();
            return await this.pb.collection('User').getFullList({
                sort: '-created',
            });
        }, 'An error occurred while retrieving the users list:');
    }

    async deleteUser(userId) {
        return await handleError(async () => {
            await this._checkAuthentication();
            const ids = await this.getUser(userId);
            for (const user of ids) {
                console.log(user.id);
                await this.pb.collection('User').delete(user.id);
            }
        }, 'An error occurred while deleting the user:');
    }

    async addVote(vote, userId, trackId) {
        return await handleError(async () => {
            await this._checkAuthentication();
            const data = {
                "vote_answer": vote, "user_id": userId, "track_id": trackId,
            };
            return await this.pb.collection('Vote').create(data);
        }, 'An error occurred while adding the vote:');
    }

    async getTodayVotesList() {
        return await handleError(async () => {
            await this._checkAuthentication();
            const {beginTime, stopTime} = this._todayRange();
            return await this.pb.collection('Vote').getFullList({
                filter: `created >= "${beginTime}" && created <= "${stopTime}"`,
            });
        }, 'An error occurred while retrieving today\'s votes list:');
    }

    async log(type, message) {
        return await handleError(async () => {
            await this._checkAuthentication();
            const data = {
                "type": type, "message": message
            };
            return await this.pb.collection('Log').create(data);
        }, 'An error occurred while logging the message:');
    }
}
